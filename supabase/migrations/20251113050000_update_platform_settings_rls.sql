-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admin can view platform settings" ON public.platform_settings;

-- Create new policy: any authenticated user can view platform settings
-- (includes public bank info needed for payments)
CREATE POLICY "Authenticated users can view platform settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (true);

-- Ensure admin-only policies exist for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admin can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admin can insert platform settings"
ON public.platform_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update platform settings" ON public.platform_settings;
CREATE POLICY "Admin can update platform settings"
ON public.platform_settings
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete platform settings" ON public.platform_settings;
CREATE POLICY "Admin can delete platform settings"
ON public.platform_settings
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
