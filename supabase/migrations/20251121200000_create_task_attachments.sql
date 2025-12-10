-- Migration: Create Task Attachments System
-- Description: Adds support for students to attach documents to tasks and milestone submissions

-- ============================================================================
-- CREATE TASK_ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Relations
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Attachment details
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  
  -- Context
  attachment_type text NOT NULL CHECK (attachment_type IN ('task_reference', 'milestone_submission')),
  milestone_id uuid REFERENCES payment_milestones(id) ON DELETE SET NULL,
  description text,
  
  -- Metadata
  is_active boolean NOT NULL DEFAULT true
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_milestone_id ON task_attachments(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachments_type ON task_attachments(attachment_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Students can view attachments for their own tasks
DROP POLICY IF EXISTS "Students can view own task attachments" ON task_attachments;
CREATE POLICY "Students can view own task attachments"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Teachers can view attachments for assigned tasks only
DROP POLICY IF EXISTS "Teachers can view assigned task attachments" ON task_attachments;
CREATE POLICY "Teachers can view assigned task attachments"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.teacher_id = auth.uid()
        AND tasks.teacher_id IS NOT NULL
    )
  );

-- Students can upload attachments to their own tasks
DROP POLICY IF EXISTS "Students can upload task attachments" ON task_attachments;
CREATE POLICY "Students can upload task attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Students can delete their own attachments
DROP POLICY IF EXISTS "Students can delete own attachments" ON task_attachments;
CREATE POLICY "Students can delete own attachments"
  ON task_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Admins can view all attachments
DROP POLICY IF EXISTS "Admins can view all attachments" ON task_attachments;
CREATE POLICY "Admins can view all attachments"
  ON task_attachments FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can upload task attachments to storage" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their task attachments from storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view task attachments" ON storage.objects;

-- Students can upload attachments to their own task folders
CREATE POLICY "Students can upload task attachments to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.student_id = auth.uid()
  )
);

-- Students can delete their own attachments
CREATE POLICY "Students can delete their task attachments from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.student_id = auth.uid()
  )
);

-- Authenticated users can view attachments for tasks they're involved in
CREATE POLICY "Authenticated users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  (
    -- Student who owns the task
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id::text = (storage.foldername(name))[1]
        AND tasks.student_id = auth.uid()
    )
    OR
    -- Assigned teacher
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id::text = (storage.foldername(name))[1]
        AND tasks.teacher_id = auth.uid()
    )
  )
);

-- Public access for generated URLs (bucket is public)
CREATE POLICY "Public can view task attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-attachments');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE task_attachments IS 'Stores metadata for task and milestone submission attachments';
COMMENT ON COLUMN task_attachments.attachment_type IS 'Type: task_reference (uploaded with task) or milestone_submission (uploaded during milestone work)';
COMMENT ON COLUMN task_attachments.milestone_id IS 'Optional: Links attachment to specific milestone submission';
