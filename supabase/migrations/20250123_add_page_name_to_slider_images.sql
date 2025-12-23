-- Add page_name column to slider_images table to support page-specific sliders
ALTER TABLE slider_images 
ADD COLUMN IF NOT EXISTS page_name VARCHAR(50) DEFAULT 'home';

-- Create index for page_name lookups
CREATE INDEX IF NOT EXISTS idx_slider_images_page_name ON slider_images(page_name);

-- Update existing records to have 'home' as default page_name
UPDATE slider_images 
SET page_name = 'home' 
WHERE page_name IS NULL;

-- Add comment
COMMENT ON COLUMN slider_images.page_name IS 'Page identifier: home, directory, marketplace, etc.';

