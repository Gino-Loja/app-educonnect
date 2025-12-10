-- Migration: Add text_content field to lessons table
-- Description: Adds a text_content column to store Markdown content for text-based lessons
-- This allows lessons to have either file-based content (videos, PDFs) or text content

-- Add text_content column to lessons table
ALTER TABLE lessons 
ADD COLUMN text_content TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN lessons.text_content IS 'Markdown content for text-based lessons. Used when content_type is ''text''. For other content types (video, pdf, image), use content_url instead.';

-- Optional: Add a check constraint to ensure either content_url or text_content is provided
-- (Commented out by default - uncomment if you want to enforce this)
-- ALTER TABLE lessons
-- ADD CONSTRAINT lessons_content_check 
-- CHECK (
--   (content_url IS NOT NULL AND text_content IS NULL) OR
--   (content_url IS NULL AND text_content IS NOT NULL) OR
--   (content_url IS NULL AND text_content IS NULL)
-- );
