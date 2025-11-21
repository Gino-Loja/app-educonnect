-- Migration: Create Submission Comments
-- Description: Adds a threaded comment channel for each task submission

-- Safety: ensure required extensions exist
DO $$
BEGIN
  PERFORM gen_random_uuid();
EXCEPTION
  WHEN undefined_function THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
END$$;

CREATE TABLE IF NOT EXISTS submission_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('student', 'teacher')),
  message text NOT NULL CHECK (char_length(message) >= 3),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_comments_submission_id ON submission_comments(submission_id, created_at DESC);

ALTER TABLE submission_comments ENABLE ROW LEVEL SECURITY;

-- Allow participants (or admins) to read the thread
DROP POLICY IF EXISTS "submission_comments_select" ON submission_comments;
CREATE POLICY "submission_comments_select"
ON submission_comments FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.task_submissions ts
    JOIN public.tasks t ON t.id = ts.task_id
    WHERE ts.id = submission_comments.submission_id
      AND (ts.teacher_id = auth.uid() OR t.student_id = auth.uid())
  )
);

-- Allow participants to add comments to their thread
DROP POLICY IF EXISTS "submission_comments_insert" ON submission_comments;
CREATE POLICY "submission_comments_insert"
ON submission_comments FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.task_submissions ts
      JOIN public.tasks t ON t.id = ts.task_id
      WHERE ts.id = submission_comments.submission_id
        AND (ts.teacher_id = auth.uid() OR t.student_id = auth.uid())
    )
  )
);

COMMENT ON TABLE submission_comments IS 'Per-submission feedback thread between student and teacher';
