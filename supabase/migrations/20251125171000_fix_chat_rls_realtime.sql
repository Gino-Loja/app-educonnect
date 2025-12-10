-- Migration: Fix chat RLS for realtime delivery
-- Ensures participants (student/teacher) can select/insert and that chat_messages/conversations are in publication.

-- Add to publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  END IF;
END$$;

-- Strengthen participant checks
CREATE OR REPLACE FUNCTION public.is_chat_participant(conversation_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (
        c.student_id = auth.uid()
        OR c.teacher_id = auth.uid()
        OR is_admin(auth.uid())
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- chat_conversations policies
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_conversations_select ON public.chat_conversations;
CREATE POLICY chat_conversations_select
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid()) OR auth.uid() IN (student_id, teacher_id)
);

DROP POLICY IF EXISTS chat_conversations_insert ON public.chat_conversations;
CREATE POLICY chat_conversations_insert
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid()) OR auth.uid() IN (student_id, teacher_id)
);

DROP POLICY IF EXISTS chat_conversations_update ON public.chat_conversations;
CREATE POLICY chat_conversations_update
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (
  is_admin(auth.uid()) OR auth.uid() IN (student_id, teacher_id)
)
WITH CHECK (
  is_admin(auth.uid()) OR auth.uid() IN (student_id, teacher_id)
);

-- chat_messages policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select
ON public.chat_messages
FOR SELECT
TO authenticated
USING (public.is_chat_participant(conversation_id));

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_chat_participant(conversation_id)
  AND sender_id = auth.uid()
);

-- Optional: allow participants to update their own messages (not used now)
DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
CREATE POLICY chat_messages_update
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  public.is_chat_participant(conversation_id) AND sender_id = auth.uid()
)
WITH CHECK (
  public.is_chat_participant(conversation_id) AND sender_id = auth.uid()
);
