-- Migration: Harden chat functions and identity
-- Description: Hardens security definer functions with explicit search_path and sets REPLICA IDENTITY FULL on chat_conversations.

-- Set REPLICA IDENTITY FULL for chat_conversations to ensure availability for joins/lookups in Realtime
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;

-- Harden is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Harden is_chat_participant function
CREATE OR REPLACE FUNCTION public.is_chat_participant(conversation_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (
        c.student_id = auth.uid()
        OR c.teacher_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execution permissions explicitly
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid) TO authenticated, service_role;
