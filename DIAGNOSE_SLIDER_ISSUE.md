# Diagnosing Directory Slider Issue

## Quick Check Steps:

1. **Check Browser Console on `/directory` page:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for messages starting with "Directory:" 
   - You should see:
     - "Directory: Fetching slider images for page=directory"
     - "Directory: Received images: X"
     - If X is 0, no images are being returned

2. **Check Server Logs:**
   - Look for `[API] Fetching slider images for page: directory`
   - Check if there's an error about `page_name` column

3. **Verify Migration Was Run:**
   - Go to Supabase Dashboard → SQL Editor
   - Run this query to check if `page_name` column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'slider_images' AND column_name = 'page_name';
   ```
   - If it returns nothing, the migration hasn't been run

4. **Check What Images Are in Database:**
   - Run this query in Supabase SQL Editor:
   ```sql
   SELECT id, page_name, is_active, image_url 
   FROM slider_images 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   - Check if any images have `page_name = 'directory'`
   - Check if `is_active = true`

5. **If Migration Not Run:**
   - Run: `supabase/migrations/20250123_add_page_name_to_slider_images.sql`
   - This adds the `page_name` column

6. **If Images Don't Have page_name Set:**
   - Update existing images:
   ```sql
   -- Set all existing images to 'home' (if they're for home page)
   UPDATE slider_images 
   SET page_name = 'home' 
   WHERE page_name IS NULL;
   
   -- Or manually set specific images to 'directory':
   UPDATE slider_images 
   SET page_name = 'directory' 
   WHERE id = 'your-image-id-here';
   ```

7. **Re-upload Images for Directory:**
   - Go to `/admin/slider-images`
   - Select "Business Directory" from the Page dropdown
   - Upload new images (they will be saved with `page_name = 'directory'`)

