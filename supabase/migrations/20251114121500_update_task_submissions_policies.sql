-- Allow both assigned teachers and task owners (students) to read submissions
DROP POLICY IF EXISTS "submissions_select_policy" ON task_submissions;

CREATE POLICY "submissions_select_policy"
ON task_submissions FOR SELECT
TO authenticated
USING (
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
