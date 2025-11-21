-- Ensure task-progress bucket exists and is publicly accessible for previews
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-progress', 'task-progress', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET public = true
WHERE id = 'task-progress';

-- Reapply public select policy in case it was missing
DROP POLICY IF EXISTS "Task progress public access" ON storage.objects;

CREATE POLICY "Task progress public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-progress');
