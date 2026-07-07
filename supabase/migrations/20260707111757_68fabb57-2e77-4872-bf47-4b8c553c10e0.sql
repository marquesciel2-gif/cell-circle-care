
-- 1. clients: restrict direct SELECT to admin/vendedor; tecnicos use masked function
DROP POLICY IF EXISTS "Tenant members read clients" ON public.clients;
CREATE POLICY "Admin and vendedor read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'vendedor'::app_role)
  )
);

-- 2. inventory: same treatment
DROP POLICY IF EXISTS "Tenant members read inventory" ON public.inventory;
CREATE POLICY "Admin and vendedor read inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'vendedor'::app_role)
  )
);

-- 3. clients INSERT: require admin or vendedor role
DROP POLICY IF EXISTS "Tenant staff insert clients" ON public.clients;
CREATE POLICY "Admin and vendedor insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
  AND created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'vendedor'::app_role)
  )
);

-- 4. Storage: remove broad public SELECT that allows listing avatars bucket.
-- Files remain reachable via public URLs (bucket stays public), but the
-- LIST endpoint can no longer enumerate objects.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 5. Lock down SECURITY DEFINER functions: revoke from anon/public,
-- grant only to authenticated (and service_role) as needed.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_clients_for_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_inventory_for_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_additional_tenant(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.switch_active_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_clients_for_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_inventory_for_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_additional_tenant(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.switch_active_tenant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
