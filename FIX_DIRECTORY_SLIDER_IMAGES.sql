-- Fix Directory Slider Images
-- Run this in Supabase SQL Editor

-- Step 1: Check what images you have and their page_name
SELECT 
  id, 
  page_name, 
  is_active, 
  created_at,
  SUBSTRING(image_url, 1, 50) as image_url_preview
FROM slider_images 
ORDER BY created_at DESC;

-- Step 2: If you want to set ALL existing images to 'home' (if they were for home page)
-- Uncomment the line below:
-- UPDATE slider_images SET page_name = 'home' WHERE page_name IS NULL;

-- Step 3: To set specific images to 'directory', first see their IDs from Step 1,
-- then replace the UUIDs below with your actual image IDs:
-- UPDATE slider_images 
-- SET page_name = 'directory' 
-- WHERE id = 'paste-actual-uuid-here';

-- Step 4: Or, if you want to set the MOST RECENT images to 'directory' (last 3 uploaded):
-- UPDATE slider_images 
-- SET page_name = 'directory' 
-- WHERE id IN (
--   SELECT id FROM slider_images 
--   ORDER BY created_at DESC 
--   LIMIT 3
-- );

-- Step 5: Verify the changes
SELECT 
  page_name, 
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as image_ids
FROM slider_images 
GROUP BY page_name;

