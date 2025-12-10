-- Allow public (no JWT) read access to payment proofs so Next.js image optimization
-- can fetch the files without an Authorization header.
-- This keeps uploads/deletes restricted while enabling inline previews.

drop policy if exists "Public read comprobantes" on storage.objects;

create policy "Public read comprobantes"
on storage.objects
for select
to anon
using (bucket_id = 'comprobantes');
