-- Migration: Fix RLS Policies Recursion
-- Description: Fixes infinite recursion in tasks table policies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Students can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Students can create tasks" ON tasks;
DROP POLICY IF EXISTS "Students can update own open tasks" ON tasks;
DROP POLICY IF EXISTS "Students can delete own open tasks" ON tasks;
DROP POLICY IF EXISTS "Teachers can view available or assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Teachers can update assigned tasks" ON tasks;

-- Recreate policies without recursion

-- Students can view their own tasks
CREATE POLICY "students_view_own_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view open tasks
CREATE POLICY "teachers_view_open_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (status = 'open');

-- Teachers can view tasks assigned to them
CREATE POLICY "teachers_view_assigned_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Teachers can view tasks they have proposals for
CREATE POLICY "teachers_view_tasks_with_proposals"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT task_id FROM proposals WHERE teacher_id = auth.uid()
    )
  );

-- Students can create tasks (must be their own)
CREATE POLICY "students_create_tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own tasks (only if status is 'open' or 'in_progress')
CREATE POLICY "students_update_own_tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() AND
    status IN ('open', 'in_progress')
  )
  WITH CHECK (student_id = auth.uid());

-- Students can delete their own tasks (only if status is 'open')
CREATE POLICY "students_delete_own_open_tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid() AND
    status = 'open'
  );

-- Teachers can update tasks assigned to them (for status changes)
CREATE POLICY "teachers_update_assigned_tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
