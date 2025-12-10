-- Migration: Make rating nullable for reviews
-- Description: Allows creating reviews with only comments (for profiles) or only ratings (for tasks)

-- Teacher Reviews
ALTER TABLE public.teacher_reviews 
  ALTER COLUMN rating DROP NOT NULL;

ALTER TABLE public.teacher_reviews 
  DROP CONSTRAINT IF EXISTS teacher_reviews_rating_check;

ALTER TABLE public.teacher_reviews 
  ADD CONSTRAINT teacher_reviews_rating_check 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE public.teacher_reviews
  ADD CONSTRAINT teacher_reviews_content_check
  CHECK (rating IS NOT NULL OR comment IS NOT NULL);

-- Student Reviews
ALTER TABLE public.student_reviews 
  ALTER COLUMN rating DROP NOT NULL;

ALTER TABLE public.student_reviews 
  DROP CONSTRAINT IF EXISTS student_reviews_rating_check;

ALTER TABLE public.student_reviews 
  ADD CONSTRAINT student_reviews_rating_check 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE public.student_reviews
  ADD CONSTRAINT student_reviews_content_check
  CHECK (rating IS NOT NULL OR comment IS NOT NULL);
