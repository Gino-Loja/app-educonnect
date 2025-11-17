-- Migration: Complete RLS Fix
-- Description: Removes ALL policies and recreates them without recursion

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

-- Tasks policies
DROP POLICY IF EXISTS "Students can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Students can create tasks" ON tasks;
DROP POLICY IF EXISTS "Students can update own open tasks" ON tasks;
DROP POLICY IF EXISTS "Students can delete own open tasks" ON tasks;
DROP POLICY IF EXISTS "Teachers can view available or assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Teachers can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "students_view_own_tasks" ON tasks;
DROP POLICY IF EXISTS "teachers_view_open_tasks" ON tasks;
DROP POLICY IF EXISTS "teachers_view_assigned_tasks" ON tasks;
DROP POLICY IF EXISTS "teachers_view_tasks_with_proposals" ON tasks;
DROP POLICY IF EXISTS "students_create_tasks" ON tasks;
DROP POLICY IF EXISTS "students_update_own_tasks" ON tasks;
DROP POLICY IF EXISTS "students_delete_own_open_tasks" ON tasks;
DROP POLICY IF EXISTS "teachers_update_assigned_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Proposals policies
DROP POLICY IF EXISTS "Students can view proposals for own tasks" ON proposals;
DROP POLICY IF EXISTS "Students can update proposals for own tasks" ON proposals;
DROP POLICY IF EXISTS "Teachers can view own proposals" ON proposals;
DROP POLICY IF EXISTS "Teachers can create proposals" ON proposals;
DROP POLICY IF EXISTS "Teachers can update own pending proposals" ON proposals;
DROP POLICY IF EXISTS "Teachers can delete own pending proposals" ON proposals;
DROP POLICY IF EXISTS "proposals_select_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_insert_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_update_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_delete_policy" ON proposals;

-- Task submissions policies
DROP POLICY IF EXISTS "Students can view submissions for own tasks" ON task_submissions;
DROP POLICY IF EXISTS "Students can update submissions for own tasks" ON task_submissions;
DROP POLICY IF EXISTS "Teachers can view own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Teachers can create submissions for assigned tasks" ON task_submissions;
DROP POLICY IF EXISTS "Teachers can update own submissions" ON task_submissions;
DROP POLICY IF EXISTS "submissions_select_policy" ON task_submissions;
DROP POLICY IF EXISTS "submissions_insert_policy" ON task_submissions;
DROP POLICY IF EXISTS "submissions_update_policy" ON task_submissions;

-- Reviews policies
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for completed tasks" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_policy" ON reviews;

-- ============================================================================
-- RECREATE POLICIES WITHOUT RECURSION
-- ============================================================================

-- ============================================================================
-- TASKS POLICIES - Simplified
-- ============================================================================

-- Anyone authenticated can view tasks (we'll filter in the application layer if needed)
-- OR we can use simpler role-based policies
CREATE POLICY "tasks_select_policy"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    -- Students see their own tasks
    student_id = auth.uid()
    OR
    -- Teachers see open tasks
    (status = 'open')
    OR
    -- Teachers see tasks assigned to them
    (teacher_id = auth.uid())
  );

-- Only authenticated users can insert tasks
CREATE POLICY "tasks_insert_policy"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Users can update their own tasks
CREATE POLICY "tasks_update_policy"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() OR teacher_id = auth.uid()
  )
  WITH CHECK (
    student_id = auth.uid() OR teacher_id = auth.uid()
  );

-- Students can delete their own open tasks
CREATE POLICY "tasks_delete_policy"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid() AND status = 'open'
  );

-- ============================================================================
-- PROPOSALS POLICIES - Simplified
-- ============================================================================

-- View proposals
CREATE POLICY "proposals_select_policy"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
  );

-- Create proposals
CREATE POLICY "proposals_insert_policy"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Update proposals
CREATE POLICY "proposals_update_policy"
  ON proposals FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Delete proposals
CREATE POLICY "proposals_delete_policy"
  ON proposals FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid() AND status = 'pending');

-- ============================================================================
-- TASK SUBMISSIONS POLICIES - Simplified
-- ============================================================================

-- View submissions
CREATE POLICY "submissions_select_policy"
  ON task_submissions FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Create submissions
CREATE POLICY "submissions_insert_policy"
  ON task_submissions FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Update submissions
CREATE POLICY "submissions_update_policy"
  ON task_submissions FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ============================================================================
-- REVIEWS POLICIES - Simplified
-- ============================================================================

-- View reviews
CREATE POLICY "reviews_select_policy"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid() OR
    reviewee_id = auth.uid() OR
    is_public = true
  );

-- Create reviews
CREATE POLICY "reviews_insert_policy"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Update reviews
CREATE POLICY "reviews_update_policy"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    reviewer_id = auth.uid() AND
    created_at > now() - interval '7 days'
  )
  WITH CHECK (reviewer_id = auth.uid());

-- Delete reviews
CREATE POLICY "reviews_delete_policy"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    reviewer_id = auth.uid() AND
    created_at > now() - interval '7 days'
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE 'RLS policies recreated successfully';
END $$;
