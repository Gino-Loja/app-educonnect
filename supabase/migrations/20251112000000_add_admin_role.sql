-- Migration: Add Admin Role
-- Description: Adds admin role to profiles and creates admin-specific policies

-- Update role check constraint to allow 'admin' role
-- Note: This assumes there's a check constraint on the role column
-- If using an enum, you'll need to add 'admin' to the enum values

-- For now, we'll assume roles are stored as text with a check constraint
-- If you need to update an enum, use: ALTER TYPE user_role ADD VALUE 'admin';

-- Add a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin access
-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can view all tasks
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view all proposals
DROP POLICY IF EXISTS "Admins can view all proposals" ON proposals;
CREATE POLICY "Admins can view all proposals"
  ON proposals FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON task_submissions;
CREATE POLICY "Admins can view all submissions"
  ON task_submissions FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view all reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can view all payment milestones
DROP POLICY IF EXISTS "Admins can view all payment_milestones" ON payment_milestones;
CREATE POLICY "Admins can view all payment_milestones"
  ON payment_milestones FOR SELECT
  USING (is_admin(auth.uid()));

-- Add comments
COMMENT ON FUNCTION is_admin IS 'Helper function to check if a user has admin role';
