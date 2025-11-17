-- Migration: Add Admin UPDATE Policy for Payment Milestones
-- Description: Allows admins to update payment milestones (verify payments, mark as paid, etc.)

-- Add UPDATE policy for admins on payment_milestones
DROP POLICY IF EXISTS "Admins can update payment_milestones" ON payment_milestones;
CREATE POLICY "Admins can update payment_milestones"
  ON payment_milestones FOR UPDATE
  USING (is_admin(auth.uid()));

-- Add comments
COMMENT ON POLICY "Admins can update payment_milestones" ON payment_milestones IS 'Allows admins to verify payments, mark as paid, and update milestone status';
