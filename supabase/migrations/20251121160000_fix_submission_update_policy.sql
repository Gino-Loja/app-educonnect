-- Allow task owners (students) to update submissions (for approval/rejection)
DROP POLICY IF EXISTS "submissions_update_policy" ON task_submissions;

CREATE POLICY "submissions_update_policy"
ON task_submissions FOR UPDATE
TO authenticated
USING (
  -- Profesor que envió la entrega
  teacher_id = auth.uid()
  OR
  -- Estudiante dueño de la tarea (para aprobar/rechazar)
  EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id = task_submissions.task_id
      AND tasks.student_id = auth.uid()
  )
)
WITH CHECK (
  -- Profesor que envió la entrega
  teacher_id = auth.uid()
  OR
  -- Estudiante dueño de la tarea
  EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id = task_submissions.task_id
      AND tasks.student_id = auth.uid()
  )
);
