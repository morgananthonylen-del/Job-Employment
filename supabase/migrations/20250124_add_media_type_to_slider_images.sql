-- =====================================================
-- Add media_type and video_url to slider_images table
-- =====================================================

-- Add media_type column (default to 'image' for existing records)
ALTER TABLE slider_images 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Add video_url column for video files
ALTER TABLE slider_images 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update existing records to have media_type = 'image'
UPDATE slider_images SET media_type = 'image' WHERE media_type IS NULL;

-- Set default for new records
ALTER TABLE slider_images 
ALTER COLUMN media_type SET DEFAULT 'image';

