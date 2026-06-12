
-- 1. Super admin helper
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = 'marquesciel2@gmail.com'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 2. Admin-side block flag on tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS admin_blocked boolean NOT NULL DEFAULT false;

-- 3. Read-everything policies for super admin
CREATE POLICY "Super admin reads all tenants"
  ON public.tenants FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin updates tenants"
  ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin reads all subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin reads all tenant members"
  ON public.tenant_members FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin reads all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin reads all user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin manages user roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
