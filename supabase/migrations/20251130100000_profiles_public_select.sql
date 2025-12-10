-- Allow authenticated users to read basic profile info (id, name, avatar, role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can view profiles basic fields'
      AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view profiles basic fields"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
