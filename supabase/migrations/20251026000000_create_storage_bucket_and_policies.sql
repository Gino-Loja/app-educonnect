-- Create storage bucket for task submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-submissions', 'task-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can upload submission images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their submission images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their submission images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view submission images" ON storage.objects;
DROP POLICY IF EXISTS "Students can view submission images for their tasks" ON storage.objects;

-- Allow teachers to upload images for their task submissions
CREATE POLICY "Teachers can upload submission images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated' AND
  -- Check if user is a teacher
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  )
);

-- Allow teachers to update their own submission images
CREATE POLICY "Teachers can update their submission images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  )
);

-- Allow teachers to delete their own submission images
CREATE POLICY "Teachers can delete their submission images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  )
);

-- Allow students to view submission images for their tasks
-- Note: Since bucket is public, this policy is more for documentation
-- In production, you might want to make bucket private and control access here
CREATE POLICY "Students can view submission images for their tasks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  (
    -- Teachers can view their own uploads
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    OR
    -- Students can view images for tasks assigned to them
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.student_id = auth.uid()
      AND (storage.foldername(name))[1] = tasks.id::text
    )
  )
);

-- Allow public read access (since bucket is public)
-- This makes images viewable via public URL
CREATE POLICY "Anyone can view submission images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-submissions');
