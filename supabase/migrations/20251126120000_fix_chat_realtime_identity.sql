-- Migration: Fix chat realtime identity
-- Description: Sets REPLICA IDENTITY FULL on chat_messages to ensure Realtime works correctly with RLS.

-- Set REPLICA IDENTITY FULL for chat_messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Ensure publication includes the tables (idempotent check)
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
