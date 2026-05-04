-- 1. Fix expenses anon deny policy (replace permissive with restrictive)
DROP POLICY IF EXISTS "Deny anon access to expenses" ON public.expenses;

CREATE POLICY "Restrict expenses to authenticated only"
ON public.expenses
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Restrict profile self-insert; only admins (or edge function via service role) can insert profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
-- "Admins can insert profiles" policy already exists and remains in effect.
-- Edge function uses service role key which bypasses RLS.
