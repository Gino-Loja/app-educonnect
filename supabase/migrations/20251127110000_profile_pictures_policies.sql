-- Migration: Configure profile-pictures bucket visibility and policies
-- Makes bucket public and defines RLS policies for storage.objects

-- Make bucket public (if you prefer private, remove this update and serve signed URLs)
update storage.buckets
set public = true
where id = 'profile-pictures';

-- Read policy: allow selects on objects in the bucket
drop policy if exists "read profile pictures" on storage.objects;
create policy "read profile pictures"
on storage.objects
for select
using (bucket_id = 'profile-pictures');

-- Insert policy: only owner (current auth user) can upload into the bucket
drop policy if exists "insert profile pictures" on storage.objects;
create policy "insert profile pictures"
on storage.objects
for insert
with check (bucket_id = 'profile-pictures' and auth.uid() = owner);

-- Update policy: only owner can update their objects
drop policy if exists "update profile pictures" on storage.objects;
create policy "update profile pictures"
on storage.objects
for update
using (bucket_id = 'profile-pictures' and auth.uid() = owner)
with check (bucket_id = 'profile-pictures' and auth.uid() = owner);

-- Delete policy: only owner can delete their objects
drop policy if exists "delete profile pictures" on storage.objects;
create policy "delete profile pictures"
on storage.objects
for delete
using (bucket_id = 'profile-pictures' and auth.uid() = owner);
