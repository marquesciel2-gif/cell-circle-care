
-- ============================================================
-- 1. TENANTS + MEMBERS
-- ============================================================

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  owner_id UUID NOT NULL,
  plano TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. CORE FUNCTIONS
-- ============================================================

-- Returns the tenant of the current authenticated user (first membership)
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Check membership
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = _user_id
  )
$$;

-- ============================================================
-- 3. BACKFILL: create "Loja Principal" with existing admin
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_tenant_id UUID;
  v_user RECORD;
BEGIN
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    -- No admin yet — pick any existing auth user, or skip
    SELECT id INTO v_admin_id FROM auth.users LIMIT 1;
  END IF;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.tenants (nome, owner_id, plano, status, trial_ends_at)
    VALUES ('Loja Principal', v_admin_id, 'pro', 'active', now() + interval '100 years')
    RETURNING id INTO v_tenant_id;

    -- Add all existing role-holders as members
    FOR v_user IN SELECT DISTINCT user_id FROM public.user_roles LOOP
      INSERT INTO public.tenant_members (tenant_id, user_id)
      VALUES (v_tenant_id, v_user.user_id)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Also add any auth user that has data but no role
    FOR v_user IN
      SELECT DISTINCT created_by AS user_id FROM public.clients
      UNION SELECT DISTINCT created_by FROM public.inventory
      UNION SELECT DISTINCT created_by FROM public.accounts_receivable
      UNION SELECT DISTINCT created_by FROM public.expenses
      UNION SELECT DISTINCT created_by FROM public.repairs
    LOOP
      IF v_user.user_id IS NOT NULL THEN
        INSERT INTO public.tenant_members (tenant_id, user_id)
        VALUES (v_tenant_id, v_user.user_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 4. ADD tenant_id TO ALL OPERATIONAL TABLES
-- ============================================================

ALTER TABLE public.clients              ADD COLUMN tenant_id UUID;
ALTER TABLE public.inventory            ADD COLUMN tenant_id UUID;
ALTER TABLE public.accounts_receivable  ADD COLUMN tenant_id UUID;
ALTER TABLE public.expenses             ADD COLUMN tenant_id UUID;
ALTER TABLE public.repairs              ADD COLUMN tenant_id UUID;
ALTER TABLE public.payments             ADD COLUMN tenant_id UUID;
ALTER TABLE public.user_roles           ADD COLUMN tenant_id UUID;

-- Backfill: assign everything to the single tenant
UPDATE public.clients             SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.inventory           SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.accounts_receivable SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.expenses            SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.repairs             SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.payments            SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);
UPDATE public.user_roles          SET tenant_id = (SELECT id FROM public.tenants LIMIT 1);

-- Enforce NOT NULL + FK
ALTER TABLE public.clients              ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.inventory            ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.accounts_receivable  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.expenses             ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.repairs              ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.payments             ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_roles           ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.clients              ADD CONSTRAINT clients_tenant_fk              FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory            ADD CONSTRAINT inventory_tenant_fk            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.accounts_receivable  ADD CONSTRAINT accounts_receivable_tenant_fk  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.expenses             ADD CONSTRAINT expenses_tenant_fk             FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.repairs              ADD CONSTRAINT repairs_tenant_fk              FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payments             ADD CONSTRAINT payments_tenant_fk             FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles           ADD CONSTRAINT user_roles_tenant_fk           FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Drop old unique that didn't include tenant
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_tenant_user_role_key UNIQUE (tenant_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_clients_tenant              ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant            ON public.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant             ON public.accounts_receivable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant             ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_repairs_tenant              ON public.repairs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant             ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant           ON public.user_roles(tenant_id);

-- ============================================================
-- 5. UPDATE has_role TO BE TENANT-SCOPED
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.tenant_id = public.get_current_tenant_id()
  )
$$;

-- ============================================================
-- 6. UPDATE SECURITY-DEFINER VIEWS / FNS TO FILTER BY TENANT
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_inventory_for_user()
RETURNS TABLE(id uuid, nome text, descricao text, categoria text, quantidade integer, preco_custo numeric, preco_venda numeric, created_by uuid, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  v_tenant := public.get_current_tenant_id();
  IF v_tenant IS NULL THEN RETURN; END IF;

  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, i.preco_custo, i.preco_venda, i.created_by, i.created_at, i.updated_at
    FROM inventory i WHERE i.tenant_id = v_tenant ORDER BY i.created_at DESC;
  ELSIF has_role(auth.uid(), 'vendedor') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, i.preco_custo, i.preco_venda, i.created_by, i.created_at, i.updated_at
    FROM inventory i WHERE i.tenant_id = v_tenant AND i.created_by = auth.uid() ORDER BY i.created_at DESC;
  ELSIF has_role(auth.uid(), 'tecnico') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, NULL::numeric, NULL::numeric, i.created_by, i.created_at, i.updated_at
    FROM inventory i WHERE i.tenant_id = v_tenant ORDER BY i.created_at DESC;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_clients_for_user()
RETURNS TABLE(id uuid, nome text, telefone text, email text, endereco text, created_by uuid, created_at timestamptz, updated_at timestamptz, tem_debito boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  v_tenant := public.get_current_tenant_id();
  IF v_tenant IS NULL THEN RETURN; END IF;
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor')) THEN RETURN; END IF;

  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT c.id, c.nome, c.telefone, c.email, c.endereco, c.created_by, c.created_at, c.updated_at,
      EXISTS (SELECT 1 FROM accounts_receivable ar WHERE ar.client_id = c.id AND ar.status = 'pendente' AND ar.tenant_id = v_tenant) AS tem_debito
    FROM clients c WHERE c.tenant_id = v_tenant ORDER BY c.nome;
  ELSE
    RETURN QUERY
    SELECT c.id, c.nome, c.telefone, NULL::text, NULL::text, c.created_by, c.created_at, c.updated_at,
      EXISTS (SELECT 1 FROM accounts_receivable ar WHERE ar.client_id = c.id AND ar.status = 'pendente' AND ar.tenant_id = v_tenant) AS tem_debito
    FROM clients c WHERE c.tenant_id = v_tenant ORDER BY c.nome;
  END IF;
END $$;

-- ============================================================
-- 7. REWRITE ALL RLS POLICIES WITH TENANT ISOLATION
-- ============================================================

-- Helper macro logic: each policy enforces tenant_id = current tenant FIRST, then role check.

-- ---------- tenants ----------
CREATE POLICY "Members see their tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(id, auth.uid()));

CREATE POLICY "Owner updates tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated can create tenant" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ---------- tenant_members ----------
CREATE POLICY "Members see members of own tenant" ON public.tenant_members
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE POLICY "Owner manages members" ON public.tenant_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tenant_id AND t.owner_id = auth.uid()));

-- ---------- clients ----------
DROP POLICY IF EXISTS "Admins full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Block direct select for non-admins" ON public.clients;
DROP POLICY IF EXISTS "Deny anon access to clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can select own clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can delete own clients" ON public.clients;

CREATE POLICY "Tenant members read clients" ON public.clients
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant staff insert clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND created_by = auth.uid());

CREATE POLICY "Admin updates any client / staff own" ON public.clients
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND (has_role(auth.uid(),'admin') OR created_by = auth.uid()));

CREATE POLICY "Admin deletes any client / staff own" ON public.clients
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND (has_role(auth.uid(),'admin') OR created_by = auth.uid()));

-- ---------- inventory ----------
DROP POLICY IF EXISTS "Admins can do everything on inventory" ON public.inventory;
DROP POLICY IF EXISTS "Vendedor can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Vendedor can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can delete inventory" ON public.inventory;
DROP POLICY IF EXISTS "Vendedor can delete own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Tecnico can view inventory without cost" ON public.inventory;
DROP POLICY IF EXISTS "Vendedor can view own inventory" ON public.inventory;

CREATE POLICY "Tenant members read inventory" ON public.inventory
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant staff insert inventory" ON public.inventory
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND created_by = auth.uid()
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'vendedor')));

CREATE POLICY "Update inventory" ON public.inventory
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

CREATE POLICY "Delete inventory" ON public.inventory
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

-- ---------- accounts_receivable ----------
DROP POLICY IF EXISTS "Admins can do everything on accounts" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Vendedor can manage own accounts" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Admins can delete accounts" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Deny anon access to accounts" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users need role for accounts" ON public.accounts_receivable;

CREATE POLICY "Tenant members read accounts" ON public.accounts_receivable
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

CREATE POLICY "Tenant staff insert accounts" ON public.accounts_receivable
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND created_by = auth.uid()
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'vendedor')));

CREATE POLICY "Update accounts" ON public.accounts_receivable
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

CREATE POLICY "Delete accounts" ON public.accounts_receivable
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND has_role(auth.uid(),'admin'));

-- ---------- expenses ----------
DROP POLICY IF EXISTS "Restrict expenses to authenticated only" ON public.expenses;
DROP POLICY IF EXISTS "Admins can do everything on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Vendedor can manage own expenses" ON public.expenses;

CREATE POLICY "Tenant read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

CREATE POLICY "Tenant insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND created_by = auth.uid()
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'vendedor')));

CREATE POLICY "Update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND created_by = auth.uid())));

CREATE POLICY "Delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND has_role(auth.uid(),'admin'));

-- ---------- repairs ----------
DROP POLICY IF EXISTS "Admins can do everything on repairs" ON public.repairs;
DROP POLICY IF EXISTS "Tecnico can insert repairs" ON public.repairs;
DROP POLICY IF EXISTS "Tecnico can update own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Tecnico can delete own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Admins can delete repairs" ON public.repairs;
DROP POLICY IF EXISTS "Tecnico can view own repairs" ON public.repairs;

CREATE POLICY "Tenant read repairs" ON public.repairs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'tecnico') AND technician_id = auth.uid())));

CREATE POLICY "Tenant insert repairs" ON public.repairs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'tecnico') AND technician_id = auth.uid())));

CREATE POLICY "Update repairs" ON public.repairs
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'tecnico') AND technician_id = auth.uid())));

CREATE POLICY "Delete repairs" ON public.repairs
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'tecnico') AND technician_id = auth.uid())));

-- ---------- payments ----------
DROP POLICY IF EXISTS "Admins can do everything on payments" ON public.payments;
DROP POLICY IF EXISTS "Vendedor can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Vendedor can view own payments" ON public.payments;

CREATE POLICY "Tenant read payments" ON public.payments
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND EXISTS (
      SELECT 1 FROM public.accounts_receivable ar WHERE ar.id = account_id AND ar.created_by = auth.uid()))));

CREATE POLICY "Tenant insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id()
    AND (has_role(auth.uid(),'admin') OR (has_role(auth.uid(),'vendedor') AND EXISTS (
      SELECT 1 FROM public.accounts_receivable ar WHERE ar.id = account_id AND ar.created_by = auth.uid()))));

-- ---------- user_roles ----------
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "User sees own roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND (user_id = auth.uid() OR has_role(auth.uid(),'admin')));

CREATE POLICY "Admin manages roles in tenant" ON public.user_roles
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id() AND has_role(auth.uid(),'admin'))
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND has_role(auth.uid(),'admin'));

-- ============================================================
-- 8. SIGNUP TRIGGER: create tenant + owner role + 14-day trial
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_nome TEXT;
  v_loja TEXT;
BEGIN
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_loja := COALESCE(NEW.raw_user_meta_data->>'loja', v_nome || ' - Loja');

  -- Create profile
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, v_nome)
  ON CONFLICT DO NOTHING;

  -- Create tenant
  INSERT INTO public.tenants (nome, owner_id, plano, status, trial_ends_at)
  VALUES (v_loja, NEW.id, 'trial', 'trialing', now() + interval '14 days')
  RETURNING id INTO v_tenant_id;

  -- Membership
  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, NEW.id);

  -- Admin role within own tenant
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'admin', v_tenant_id);

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at on tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
