-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'proposal_received', 'proposal_accepted', 'proposal_rejected', 'task_submitted', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to navigate to when clicking notification
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Additional data (proposal_id, task_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;

-- RLS Policies
CREATE POLICY "users_view_own_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger function to create notification when proposal is created
CREATE OR REPLACE FUNCTION notify_student_on_proposal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_task_title TEXT;
  v_teacher_name TEXT;
BEGIN
  -- Get student_id and task title
  SELECT t.student_id, t.title
  INTO v_student_id, v_task_title
  FROM tasks t
  WHERE t.id = NEW.task_id;

  -- Get teacher name
  SELECT p.name
  INTO v_teacher_name
  FROM profiles p
  WHERE p.id = NEW.teacher_id;

  -- Create notification for student
  PERFORM create_notification(
    v_student_id,
    'proposal_received',
    'Nueva propuesta recibida',
    COALESCE(v_teacher_name, 'Un profesor') || ' ha enviado una propuesta para tu tarea "' || v_task_title || '"',
    '/workspace/propuestas?highlight=' || NEW.id::text,
    jsonb_build_object(
      'proposal_id', NEW.id,
      'task_id', NEW.task_id,
      'teacher_id', NEW.teacher_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_student_on_proposal ON proposals;
CREATE TRIGGER trigger_notify_student_on_proposal
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_on_proposal();

-- Trigger function to notify teacher when proposal is accepted/rejected
CREATE OR REPLACE FUNCTION notify_teacher_on_proposal_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_title TEXT;
  v_student_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only trigger if status changed to accepted or rejected
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN

    -- Get task title
    SELECT t.title
    INTO v_task_title
    FROM tasks t
    WHERE t.id = NEW.task_id;

    -- Get student name
    SELECT p.name
    INTO v_student_name
    FROM profiles p
    JOIN tasks t ON t.student_id = p.id
    WHERE t.id = NEW.task_id;

    -- Set notification content based on status
    IF NEW.status = 'accepted' THEN
      v_notification_title := 'Propuesta aceptada';
      v_notification_message := COALESCE(v_student_name, 'El estudiante') || ' ha aceptado tu propuesta para "' || v_task_title || '"';
    ELSE
      v_notification_title := 'Propuesta rechazada';
      v_notification_message := COALESCE(v_student_name, 'El estudiante') || ' ha rechazado tu propuesta para "' || v_task_title || '"';
    END IF;

    -- Create notification for teacher
    PERFORM create_notification(
      NEW.teacher_id,
      'proposal_' || NEW.status,
      v_notification_title,
      v_notification_message,
      '/workspace/mis-propuestas?highlight=' || NEW.id::text,
      jsonb_build_object(
        'proposal_id', NEW.id,
        'task_id', NEW.task_id,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_teacher_on_proposal_status ON proposals;
CREATE TRIGGER trigger_notify_teacher_on_proposal_status
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_on_proposal_status();

-- Trigger function to notify student when work is submitted
CREATE OR REPLACE FUNCTION notify_student_on_work_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_task_title TEXT;
  v_teacher_name TEXT;
BEGIN
  -- Get student_id and task title
  SELECT t.student_id, t.title
  INTO v_student_id, v_task_title
  FROM tasks t
  WHERE t.id = NEW.task_id;

  -- Get teacher name
  SELECT p.name
  INTO v_teacher_name
  FROM profiles p
  WHERE p.id = NEW.teacher_id;

  -- Create notification for student
  PERFORM create_notification(
    v_student_id,
    'work_submitted',
    'Trabajo entregado',
    COALESCE(v_teacher_name, 'El profesor') || ' ha entregado el trabajo para tu tarea "' || v_task_title || '"',
    '/workspace/mis-tareas?highlight=' || NEW.task_id::text,
    jsonb_build_object(
      'submission_id', NEW.id,
      'task_id', NEW.task_id,
      'teacher_id', NEW.teacher_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_student_on_work_submitted ON task_submissions;
CREATE TRIGGER trigger_notify_student_on_work_submitted
  AFTER INSERT ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_on_work_submitted();

-- Trigger function to notify teacher when submission is reviewed (approved/rejected)
CREATE OR REPLACE FUNCTION notify_teacher_on_submission_reviewed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_title TEXT;
  v_student_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only trigger if is_approved changed from NULL to a value
  IF NEW.is_approved IS NOT NULL AND OLD.is_approved IS NULL THEN

    -- Get task title
    SELECT t.title
    INTO v_task_title
    FROM tasks t
    WHERE t.id = NEW.task_id;

    -- Get student name
    SELECT p.name
    INTO v_student_name
    FROM profiles p
    JOIN tasks t ON t.student_id = p.id
    WHERE t.id = NEW.task_id;

    -- Set notification content based on approval
    IF NEW.is_approved = true THEN
      v_notification_title := 'Trabajo aprobado';
      v_notification_message := COALESCE(v_student_name, 'El estudiante') || ' ha aprobado tu trabajo para "' || v_task_title || '"';
    ELSE
      v_notification_title := 'Trabajo rechazado';
      v_notification_message := COALESCE(v_student_name, 'El estudiante') || ' ha solicitado correcciones para "' || v_task_title || '"';
    END IF;

    -- Create notification for teacher
    PERFORM create_notification(
      NEW.teacher_id,
      CASE WHEN NEW.is_approved THEN 'work_approved' ELSE 'work_rejected' END,
      v_notification_title,
      v_notification_message,
      '/workspace/mis-trabajos?highlight=' || NEW.task_id::text,
      jsonb_build_object(
        'submission_id', NEW.id,
        'task_id', NEW.task_id,
        'is_approved', NEW.is_approved,
        'feedback', NEW.student_feedback
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_teacher_on_submission_reviewed ON task_submissions;
CREATE TRIGGER trigger_notify_teacher_on_submission_reviewed
  AFTER UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_on_submission_reviewed();
