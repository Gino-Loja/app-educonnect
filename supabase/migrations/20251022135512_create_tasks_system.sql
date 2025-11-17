-- Migration: Create Tasks System
-- Description: Creates tables for tasks, proposals, submissions, and reviews

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'open',
    'in_progress',
    'submitted',
    'completed',
    'cancelled',
    'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task priority enum
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment type enum
DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM (
    'per_hour',
    'fixed',
    'negotiable'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Proposal status enum
DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Relations
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Basic information
  title text NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  description text NOT NULL CHECK (char_length(description) >= 20),
  subject text NOT NULL,
  academic_level text NOT NULL,

  -- Academic details
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic_tags text[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',

  -- Budget and payment
  budget_min decimal(10,2) CHECK (budget_min >= 0),
  budget_max decimal(10,2) CHECK (budget_max >= budget_min),
  payment_type payment_type DEFAULT 'negotiable',

  -- Important dates
  due_date timestamptz,
  estimated_hours decimal(4,1) CHECK (estimated_hours > 0),

  -- Status and workflow
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'normal',

  -- Proposals and selection
  proposals_count integer NOT NULL DEFAULT 0 CHECK (proposals_count >= 0),
  selected_proposal_id uuid,

  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  completion_date timestamptz,

  -- Constraints
  CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date > created_at),
  CONSTRAINT valid_completion_date CHECK (completion_date IS NULL OR completion_date >= created_at)
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Relations
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Proposal details
  proposed_amount decimal(10,2) NOT NULL CHECK (proposed_amount > 0),
  estimated_hours decimal(4,1) CHECK (estimated_hours > 0),
  cover_letter text NOT NULL CHECK (char_length(cover_letter) >= 50),
  message text,

  -- Status
  status proposal_status NOT NULL DEFAULT 'pending',
  response_date timestamptz,

  -- Metadata
  is_active boolean NOT NULL DEFAULT true,

  -- Constraints
  CONSTRAINT unique_teacher_per_task UNIQUE(task_id, teacher_id),
  CONSTRAINT valid_response_date CHECK (response_date IS NULL OR response_date >= created_at)
);

-- Task submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Relations
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Submission content
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  notes text,

  -- Status
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  is_approved boolean,
  student_feedback text,

  -- Version control (permite multiples entregas)
  version integer NOT NULL DEFAULT 1,
  is_final boolean NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT valid_reviewed_at CHECK (reviewed_at IS NULL OR reviewed_at >= submitted_at)
);

-- Reviews table (bidirectional: student reviews teacher, teacher reviews student)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Relations
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Review content
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text CHECK (char_length(comment) >= 10),

  -- Categories (optional detailed ratings)
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),

  -- Metadata
  is_public boolean NOT NULL DEFAULT true,
  is_edited boolean NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT unique_review_per_task UNIQUE(task_id, reviewer_id, reviewee_id),
  CONSTRAINT different_users CHECK (reviewer_id != reviewee_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_teacher_id ON tasks(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status ON tasks(priority, status) WHERE is_active = true;

-- Proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_task_id ON proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_proposals_teacher_id ON proposals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_teacher_id ON task_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON task_submissions(submitted_at DESC);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating) WHERE is_public = true;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key for selected_proposal_id (after proposals table exists)
DO $$ BEGIN
  ALTER TABLE tasks
    ADD CONSTRAINT fk_selected_proposal
    FOREIGN KEY (selected_proposal_id)
    REFERENCES proposals(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp (solo crear si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON task_submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment proposals_count when a new proposal is created
CREATE OR REPLACE FUNCTION increment_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks
  SET proposals_count = proposals_count + 1
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_task_proposals_count ON proposals;
CREATE TRIGGER increment_task_proposals_count
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION increment_proposals_count();

-- Trigger to decrement proposals_count when a proposal is deleted
CREATE OR REPLACE FUNCTION decrement_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks
  SET proposals_count = GREATEST(0, proposals_count - 1)
  WHERE id = OLD.task_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decrement_task_proposals_count ON proposals;
CREATE TRIGGER decrement_task_proposals_count
  AFTER DELETE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION decrement_proposals_count();

-- Trigger to update task status and teacher_id when proposal is accepted
CREATE OR REPLACE FUNCTION handle_proposal_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Update task with teacher and change status
    UPDATE tasks
    SET
      teacher_id = NEW.teacher_id,
      status = 'in_progress',
      selected_proposal_id = NEW.id
    WHERE id = NEW.task_id;

    -- Reject all other proposals for this task
    UPDATE proposals
    SET status = 'rejected'
    WHERE task_id = NEW.task_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_proposal_acceptance_trigger ON proposals;
CREATE TRIGGER handle_proposal_acceptance_trigger
  AFTER UPDATE ON proposals
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION handle_proposal_acceptance();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - TASKS
-- ============================================================================

-- Students can view their own tasks
DROP POLICY IF EXISTS "Students can view own tasks" ON tasks;
CREATE POLICY "Students can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create tasks (must be their own)
DROP POLICY IF EXISTS "Students can create tasks" ON tasks;
CREATE POLICY "Students can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own tasks (only if status is 'open' or 'in_progress')
DROP POLICY IF EXISTS "Students can update own open tasks" ON tasks;
CREATE POLICY "Students can update own open tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = student_id AND status IN ('open', 'in_progress'))
  WITH CHECK (auth.uid() = student_id);

-- Students can delete their own tasks (only if status is 'open')
DROP POLICY IF EXISTS "Students can delete own open tasks" ON tasks;
CREATE POLICY "Students can delete own open tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = student_id AND status = 'open');

-- Teachers can view open tasks or tasks assigned to them
DROP POLICY IF EXISTS "Teachers can view available or assigned tasks" ON tasks;
CREATE POLICY "Teachers can view available or assigned tasks"
  ON tasks FOR SELECT
  USING (
    status = 'open' OR
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.task_id = tasks.id
        AND proposals.teacher_id = auth.uid()
    )
  );

-- Teachers can update tasks assigned to them (limited fields)
DROP POLICY IF EXISTS "Teachers can update assigned tasks" ON tasks;
CREATE POLICY "Teachers can update assigned tasks"
  ON tasks FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - PROPOSALS
-- ============================================================================

-- Students can view proposals for their tasks
DROP POLICY IF EXISTS "Students can view proposals for own tasks" ON proposals;
CREATE POLICY "Students can view proposals for own tasks"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Students can update proposals for their tasks (accept/reject)
DROP POLICY IF EXISTS "Students can update proposals for own tasks" ON proposals;
CREATE POLICY "Students can update proposals for own tasks"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Teachers can view their own proposals
DROP POLICY IF EXISTS "Teachers can view own proposals" ON proposals;
CREATE POLICY "Teachers can view own proposals"
  ON proposals FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create proposals for open tasks
DROP POLICY IF EXISTS "Teachers can create proposals" ON proposals;
CREATE POLICY "Teachers can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = proposals.task_id
        AND tasks.status = 'open'
        AND tasks.student_id != auth.uid()
    )
  );

-- Teachers can update their own pending proposals
DROP POLICY IF EXISTS "Teachers can update own pending proposals" ON proposals;
CREATE POLICY "Teachers can update own pending proposals"
  ON proposals FOR UPDATE
  USING (teacher_id = auth.uid() AND status = 'pending')
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their own pending proposals
DROP POLICY IF EXISTS "Teachers can delete own pending proposals" ON proposals;
CREATE POLICY "Teachers can delete own pending proposals"
  ON proposals FOR DELETE
  USING (teacher_id = auth.uid() AND status = 'pending');

-- ============================================================================
-- RLS POLICIES - TASK SUBMISSIONS
-- ============================================================================

-- Students can view submissions for their tasks
DROP POLICY IF EXISTS "Students can view submissions for own tasks" ON task_submissions;
CREATE POLICY "Students can view submissions for own tasks"
  ON task_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_submissions.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Students can update submissions (review/approve)
DROP POLICY IF EXISTS "Students can update submissions for own tasks" ON task_submissions;
CREATE POLICY "Students can update submissions for own tasks"
  ON task_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_submissions.task_id
        AND tasks.student_id = auth.uid()
    )
  );

-- Teachers can view their own submissions
DROP POLICY IF EXISTS "Teachers can view own submissions" ON task_submissions;
CREATE POLICY "Teachers can view own submissions"
  ON task_submissions FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create submissions for assigned tasks
DROP POLICY IF EXISTS "Teachers can create submissions for assigned tasks" ON task_submissions;
CREATE POLICY "Teachers can create submissions for assigned tasks"
  ON task_submissions FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_submissions.task_id
        AND tasks.teacher_id = auth.uid()
        AND tasks.status IN ('in_progress', 'submitted')
    )
  );

-- Teachers can update their own submissions (before approval)
DROP POLICY IF EXISTS "Teachers can update own submissions" ON task_submissions;
CREATE POLICY "Teachers can update own submissions"
  ON task_submissions FOR UPDATE
  USING (teacher_id = auth.uid() AND is_approved IS NULL)
  WITH CHECK (teacher_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - REVIEWS
-- ============================================================================

-- Users can view reviews where they are reviewer or reviewee
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (
    reviewer_id = auth.uid() OR
    reviewee_id = auth.uid() OR
    is_public = true
  );

-- Users can create reviews for completed tasks they participated in
DROP POLICY IF EXISTS "Users can create reviews for completed tasks" ON reviews;
CREATE POLICY "Users can create reviews for completed tasks"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = reviews.task_id
        AND tasks.status = 'completed'
        AND (
          tasks.student_id = auth.uid() OR
          tasks.teacher_id = auth.uid()
        )
    )
  );

-- Users can update their own reviews (within timeframe)
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (
    reviewer_id = auth.uid() AND
    created_at > now() - interval '7 days'
  )
  WITH CHECK (reviewer_id = auth.uid());

-- Users can delete their own reviews (within timeframe)
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (
    reviewer_id = auth.uid() AND
    created_at > now() - interval '7 days'
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tasks IS 'Main tasks table - stores educational tasks created by students';
COMMENT ON TABLE proposals IS 'Teacher proposals for tasks';
COMMENT ON TABLE task_submissions IS 'Work submissions from teachers';
COMMENT ON TABLE reviews IS 'Bidirectional reviews between students and teachers';

COMMENT ON COLUMN tasks.status IS 'Current status of the task in the workflow';
COMMENT ON COLUMN tasks.priority IS 'Priority level set by the student';
COMMENT ON COLUMN tasks.payment_type IS 'How the payment will be structured';
COMMENT ON COLUMN proposals.status IS 'Current status of the proposal';
COMMENT ON COLUMN task_submissions.version IS 'Version number for multiple submissions';
COMMENT ON COLUMN reviews.is_public IS 'Whether the review is visible to other users';
