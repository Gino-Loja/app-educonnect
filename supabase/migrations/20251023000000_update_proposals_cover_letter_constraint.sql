-- Update cover_letter check constraint to require minimum 10 characters instead of 50
DO $$ BEGIN
  ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_cover_letter_check;

  ALTER TABLE proposals
  ADD CONSTRAINT proposals_cover_letter_check
  CHECK (char_length(cover_letter) >= 10 AND char_length(cover_letter) <= 2000);
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN null;
END $$;
