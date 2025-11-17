-- Update payment_milestones table to add new statuses and payment verification fields

-- Add new columns for payment verification
ALTER TABLE public.payment_milestones
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the status constraint to include new statuses
ALTER TABLE public.payment_milestones
DROP CONSTRAINT IF EXISTS payment_milestones_status_check;

ALTER TABLE public.payment_milestones
ADD CONSTRAINT payment_milestones_status_check
CHECK (status IN ('pending_payment', 'pending_verification', 'in_custody', 'paid', 'rejected'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON public.payment_milestones(status);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_submitted_at ON public.payment_milestones(submitted_at);

-- Add comments for documentation
COMMENT ON COLUMN public.payment_milestones.status IS 'Payment status: pending_payment (student must pay), pending_verification (proof uploaded, awaiting admin), in_custody (admin verified, funds held), paid (admin transferred to teacher), rejected (proof rejected)';
COMMENT ON COLUMN public.payment_milestones.payment_proof_url IS 'URL to uploaded payment proof document';
COMMENT ON COLUMN public.payment_milestones.payment_reference IS 'Transaction reference number from student';
COMMENT ON COLUMN public.payment_milestones.submitted_at IS 'When student uploaded payment proof';
COMMENT ON COLUMN public.payment_milestones.verified_at IS 'When admin verified the payment';
COMMENT ON COLUMN public.payment_milestones.verified_by IS 'Admin user who verified the payment';
COMMENT ON COLUMN public.payment_milestones.paid_at IS 'When admin marked as paid to teacher';
COMMENT ON COLUMN public.payment_milestones.paid_by IS 'Admin user who marked as paid';
COMMENT ON COLUMN public.payment_milestones.rejection_reason IS 'Reason for payment proof rejection';
