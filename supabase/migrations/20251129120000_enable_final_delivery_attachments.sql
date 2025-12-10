-- Allow final delivery attachments and teacher uploads/deletes

-- Extend allowed attachment types
ALTER TABLE task_attachments
  DROP CONSTRAINT IF EXISTS task_attachments_attachment_type_check;

ALTER TABLE task_attachments
  ADD CONSTRAINT task_attachments_attachment_type_check
  CHECK (attachment_type IN ('task_reference', 'milestone_submission', 'final_delivery'));

-- Allow teachers to upload attachments for tasks they are assigned to
DROP POLICY IF EXISTS "Teachers can upload task attachments" ON task_attachments;
CREATE POLICY "Teachers can upload task attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.teacher_id = auth.uid()
    )
  );

-- Allow teachers to delete attachments for tasks they are assigned to
DROP POLICY IF EXISTS "Teachers can delete task attachments" ON task_attachments;
CREATE POLICY "Teachers can delete task attachments"
  ON task_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
        AND tasks.teacher_id = auth.uid()
    )
  );

-- Storage: allow teachers to upload/delete objects for their assigned tasks
DROP POLICY IF EXISTS "Teachers can upload task attachments to storage" ON storage.objects;
CREATE POLICY "Teachers can upload task attachments to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can delete task attachments from storage" ON storage.objects;
CREATE POLICY "Teachers can delete task attachments from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id::text = (storage.foldername(name))[1]
      AND tasks.teacher_id = auth.uid()
  )
);
