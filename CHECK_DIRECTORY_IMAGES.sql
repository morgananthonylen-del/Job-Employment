-- Check Directory Slider Images Status
-- Run this in Supabase SQL Editor

-- Check if images exist with page_name='directory' and is_active=true
SELECT 
  id, 
  page_name, 
  is_active, 
  display_order,
  created_at,
  SUBSTRING(image_url, 1, 80) as image_url_preview
FROM slider_images 
WHERE page_name = 'directory'
ORDER BY display_order, created_at DESC;

-- If images exist but is_active = false, activate them:
-- UPDATE slider_images 
-- SET is_active = true 
-- WHERE page_name = 'directory';

-- Count by page and active status
SELECT 
  page_name,
  is_active,
  COUNT(*) as count
FROM slider_images 
GROUP BY page_name, is_active
ORDER BY page_name, is_active;

