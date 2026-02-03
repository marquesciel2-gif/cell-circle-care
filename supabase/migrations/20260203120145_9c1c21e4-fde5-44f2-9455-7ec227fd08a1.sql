-- Fix RLS policies for clients table
-- Drop problematic policy
DROP POLICY IF EXISTS "Non-admins cannot select clients directly" ON public.clients;

-- Create policy that explicitly requires authentication for any SELECT
-- Direct SELECT is blocked - app should use get_clients_for_user() function
CREATE POLICY "Block direct select for non-admins"
ON public.clients
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit deny for anon users (unauthenticated)
CREATE POLICY "Deny anon access to clients"
ON public.clients
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Fix RLS policies for accounts_receivable table  
-- Add explicit deny for anon users
CREATE POLICY "Deny anon access to accounts"
ON public.accounts_receivable
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure authenticated users need proper roles
CREATE POLICY "Authenticated users need role for accounts"
ON public.accounts_receivable
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'vendedor'::app_role) AND created_by = auth.uid())
);