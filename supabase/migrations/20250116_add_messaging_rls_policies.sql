-- =====================================================
-- RLS Policies for Messaging Tables
-- =====================================================
-- Since we're using custom JWT authentication (not Supabase Auth),
-- we allow all operations on these tables. Authentication is handled
-- in the API routes via JWT verification.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Job seekers can create threads" ON job_post_threads;
DROP POLICY IF EXISTS "Job seekers can view own threads" ON job_post_threads;
DROP POLICY IF EXISTS "Businesses can view their job threads" ON job_post_threads;
DROP POLICY IF EXISTS "Job seekers can send messages" ON job_post_messages;
DROP POLICY IF EXISTS "Businesses can send messages" ON job_post_messages;
DROP POLICY IF EXISTS "Job seekers can view thread messages" ON job_post_messages;
DROP POLICY IF EXISTS "Businesses can view thread messages" ON job_post_messages;
DROP POLICY IF EXISTS "Service role full access threads" ON job_post_threads;
DROP POLICY IF EXISTS "Service role full access messages" ON job_post_messages;
DROP POLICY IF EXISTS "Service role full access cleanup queue" ON job_message_cleanup_queue;

-- Allow all operations on job_post_threads (auth checked in API routes)
CREATE POLICY "Service role full access threads" ON job_post_threads
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on job_post_messages (auth checked in API routes)
CREATE POLICY "Service role full access messages" ON job_post_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on job_message_cleanup_queue (auth checked in API routes)
CREATE POLICY "Service role full access cleanup queue" ON job_message_cleanup_queue
    FOR ALL USING (true) WITH CHECK (true);





