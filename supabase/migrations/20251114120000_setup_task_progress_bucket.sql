-- Bucket for task progress evidence uploaded by teachers
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-progress', 'task-progress', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up previous policies if rerun
DROP POLICY IF EXISTS "Task progress uploads" ON storage.objects;
DROP POLICY IF EXISTS "Task progress deletions" ON storage.objects;
DROP POLICY IF EXISTS "Task progress access (authed)" ON storage.objects;
DROP POLICY IF EXISTS "Task progress public access" ON storage.objects;

-- Helper expression: first folder matches task id (UUID stored as text)
-- storage.foldername(name) returns the folder levels split by '/'

-- Allow the assigned teacher to upload progress images to folders named with the task UUID
CREATE POLICY "Task progress uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-progress'
  AND EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.teacher_id = auth.uid()
  )
);

-- Allow the same teacher to delete their uploaded files (e.g., para corregir la evidencia)
CREATE POLICY "Task progress deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-progress'
  AND EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.teacher_id = auth.uid()
  )
);

-- Allow authenticated users to read progress if they are either the teacher or the student of that task
CREATE POLICY "Task progress access (authed)"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-progress'
  AND (
    EXISTS (
      SELECT 1
      FROM public.tasks
      WHERE tasks.id::text = (storage.foldername(name))[1]
        AND tasks.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.tasks
      WHERE tasks.id::text = (storage.foldername(name))[1]
        AND tasks.student_id = auth.uid()
    )
  )
);

-- Because the bucket is marked as public, expose read-only access for the generated public URLs
CREATE POLICY "Task progress public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-progress');
