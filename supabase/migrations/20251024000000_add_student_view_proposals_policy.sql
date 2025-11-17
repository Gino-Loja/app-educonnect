-- Add policy for students to view proposals for their tasks

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "proposals_select_policy" ON proposals;
DROP POLICY IF EXISTS "Students can view proposals for own tasks" ON proposals;
DROP POLICY IF EXISTS "Teachers can view own proposals" ON proposals;

-- Students can view proposals for their own tasks
CREATE POLICY "students_view_proposals_for_own_tasks"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Teachers can view their own proposals
CREATE POLICY "teachers_view_own_proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students can update proposals for their tasks (accept/reject)
DROP POLICY IF EXISTS "proposals_update_policy" ON proposals;
DROP POLICY IF EXISTS "Students can update proposals for own tasks" ON proposals;

CREATE POLICY "students_update_proposals_for_own_tasks"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Teachers can update their own pending proposals
DROP POLICY IF EXISTS "Teachers can update own pending proposals" ON proposals;

CREATE POLICY "teachers_update_own_proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid() AND status = 'pending')
  WITH CHECK (teacher_id = auth.uid());
