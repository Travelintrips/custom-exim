DROP POLICY IF EXISTS "Allow public registration" ON public.users;

CREATE POLICY "Allow public registration"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (true);
