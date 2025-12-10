-- Migration: Create chat tables for student-teacher messaging (propuestas aceptadas)
-- Description: Adds chat_conversations and chat_messages with RLS for participants only.

-- Safety: ensure required extensions exist
DO $$
BEGIN
  PERFORM gen_random_uuid();
EXCEPTION
  WHEN undefined_function THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
END$$;

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz,
  last_message_sender_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_conversations_one_per_task UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_task_id ON public.chat_conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON public.chat_conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id, created_at DESC);

-- Keep updated_at current on chat_conversations
CREATE OR REPLACE FUNCTION public.update_chat_conversations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER trg_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_conversations_updated_at();

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper predicate: user participates in conversation
CREATE OR REPLACE FUNCTION public.is_chat_participant(conversation_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid() OR is_admin(auth.uid()))
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- chat_conversations policies
DROP POLICY IF EXISTS chat_conversations_select ON public.chat_conversations;
CREATE POLICY chat_conversations_select
ON public.chat_conversations
FOR SELECT
USING (
  is_admin(auth.uid())
  OR (auth.uid() = student_id OR auth.uid() = teacher_id)
);

DROP POLICY IF EXISTS chat_conversations_insert ON public.chat_conversations;
CREATE POLICY chat_conversations_insert
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  is_admin(auth.uid())
  OR (auth.uid() = student_id OR auth.uid() = teacher_id)
);

DROP POLICY IF EXISTS chat_conversations_update ON public.chat_conversations;
CREATE POLICY chat_conversations_update
ON public.chat_conversations
FOR UPDATE
USING (
  is_admin(auth.uid())
  OR (auth.uid() = student_id OR auth.uid() = teacher_id)
);

-- chat_messages policies
DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select
ON public.chat_messages
FOR SELECT
USING (public.is_chat_participant(conversation_id));

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert
ON public.chat_messages
FOR INSERT
WITH CHECK (
  public.is_chat_participant(conversation_id)
  AND sender_id = auth.uid()
);

-- Realtime publication for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

COMMENT ON TABLE public.chat_conversations IS 'Conversación 1:1 entre estudiante y profesor vinculada a una tarea con propuesta aceptada';
COMMENT ON TABLE public.chat_messages IS 'Mensajes en tiempo real entre estudiante y profesor';
