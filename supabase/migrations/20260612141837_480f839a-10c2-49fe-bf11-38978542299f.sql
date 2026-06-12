
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.active_tenant_id
       FROM public.profiles p
       JOIN public.tenant_members tm
         ON tm.user_id = p.user_id AND tm.tenant_id = p.active_tenant_id
      WHERE p.user_id = auth.uid()
      LIMIT 1),
    (SELECT tenant_id FROM public.tenant_members
      WHERE user_id = auth.uid()
      ORDER BY created_at ASC
      LIMIT 1)
  )
$$;

CREATE OR REPLACE FUNCTION public.switch_active_tenant(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
  ) THEN
    RAISE EXCEPTION 'not a member of this tenant';
  END IF;
  UPDATE public.profiles SET active_tenant_id = _tenant_id WHERE user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.create_additional_tenant(_nome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_business boolean;
  v_new_tenant uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _nome IS NULL OR length(trim(_nome)) = 0 THEN
    RAISE EXCEPTION 'nome obrigatório';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.owner_id = v_uid
      AND t.plano = 'business'
      AND t.status IN ('active','trialing')
  ) INTO v_has_business;

  IF NOT v_has_business THEN
    RAISE EXCEPTION 'multi-loja disponível apenas no plano Business';
  END IF;

  INSERT INTO public.tenants (nome, owner_id, plano, status, trial_ends_at, onboarded)
  VALUES (trim(_nome), v_uid, 'business', 'active', now() + interval '14 days', true)
  RETURNING id INTO v_new_tenant;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_new_tenant, v_uid);

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (v_uid, 'admin', v_new_tenant);

  UPDATE public.profiles SET active_tenant_id = v_new_tenant WHERE user_id = v_uid;

  RETURN v_new_tenant;
END $$;

GRANT EXECUTE ON FUNCTION public.switch_active_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_additional_tenant(text) TO authenticated;
