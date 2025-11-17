-- Migration: Add Payment Milestones System
-- Description: Adds support for installment payments and milestone tracking

-- Add installments field to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1 CHECK (installments >= 1 AND installments <= 5);

COMMENT ON COLUMN public.tasks.installments IS 'Number of payment installments (1-5). Only applicable if budget > $50';

-- Create payment_milestones table
CREATE TABLE IF NOT EXISTS public.payment_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    milestone_number integer NOT NULL CHECK (milestone_number >= 1 AND milestone_number <= 5),
    title varchar(255) NOT NULL,
    description text,
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    due_date timestamp with time zone,
    status varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'paid')),
    submission_id uuid REFERENCES public.task_submissions(id) ON DELETE SET NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(task_id, milestone_number)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_milestones_task_id ON public.payment_milestones(task_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON public.payment_milestones(status);

-- Add RLS policies for payment_milestones
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;

-- Students can view milestones for their tasks
CREATE POLICY "Students can view their task milestones"
    ON public.payment_milestones FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM public.tasks WHERE student_id = auth.uid()
        )
    );

-- Teachers can view milestones for tasks they're assigned to
CREATE POLICY "Teachers can view their assigned task milestones"
    ON public.payment_milestones FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM public.tasks WHERE teacher_id = auth.uid()
        )
    );

-- Only system/students can create milestones (when creating task)
CREATE POLICY "Students can create milestones for their tasks"
    ON public.payment_milestones FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM public.tasks WHERE student_id = auth.uid()
        )
    );

-- Students and teachers can update milestone status
CREATE POLICY "Students and teachers can update milestones"
    ON public.payment_milestones FOR UPDATE
    USING (
        task_id IN (
            SELECT id FROM public.tasks
            WHERE student_id = auth.uid() OR teacher_id = auth.uid()
        )
    );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_payment_milestone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_milestones_updated_at
    BEFORE UPDATE ON public.payment_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_milestone_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.payment_milestones IS 'Tracks payment milestones/installments for tasks with split payments';
COMMENT ON COLUMN public.payment_milestones.milestone_number IS 'Sequential number of the milestone (1, 2, 3, etc.)';
COMMENT ON COLUMN public.payment_milestones.status IS 'Status: pending, in_progress, submitted, approved, paid';
