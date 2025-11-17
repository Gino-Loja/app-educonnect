-- Setup storage bucket for payment proofs (comprobantes)
-- Note: The bucket 'comprobantes' should already be created in Supabase UI
-- This migration sets up the RLS policies for the bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own payment proofs" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to their own folder
-- Files are organized as: {userId}/{milestoneId}-{timestamp}.{ext}
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'comprobantes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow all authenticated users to view payment proofs
-- This is needed for admins to verify proofs and teachers to see payment status
CREATE POLICY "Authenticated users can view payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'comprobantes');

-- Policy 3: Allow users to delete only their own payment proofs
-- This allows students to remove/replace proofs if needed
CREATE POLICY "Users can delete their own payment proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprobantes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to update their own payment proofs (for replacements)
CREATE POLICY "Users can update their own payment proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'comprobantes' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'comprobantes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Make sure the 'comprobantes' bucket exists in Storage
-- If it doesn't exist, create it with:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket named 'comprobantes'
-- 3. Set as Public bucket: NO (we use RLS policies instead)
-- 4. File size limit: 5MB (optional)
-- 5. Allowed MIME types: image/png, image/jpeg, application/pdf (optional)
