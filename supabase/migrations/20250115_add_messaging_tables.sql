-- =====================================================
-- Messaging System Tables
-- =====================================================
-- Allows job seekers to message businesses on Pro job posts
-- =====================================================

-- Job Post Threads: One thread per job post + job seeker combination
CREATE TABLE IF NOT EXISTS job_post_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, job_seeker_id)
);

-- Job Post Messages: Individual messages within a thread
CREATE TABLE IF NOT EXISTS job_post_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES job_post_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('jobseeker', 'business')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Message Cleanup Queue: Tracks threads to be cleaned up after interviews
CREATE TABLE IF NOT EXISTS job_message_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleanup_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cleanup_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_post_threads_job_id ON job_post_threads(job_id);
CREATE INDEX IF NOT EXISTS idx_job_post_threads_job_seeker_id ON job_post_threads(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_post_threads_business_id ON job_post_threads(business_id);
CREATE INDEX IF NOT EXISTS idx_job_post_threads_last_message_at ON job_post_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_post_messages_thread_id ON job_post_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_job_post_messages_sender_id ON job_post_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_post_messages_created_at ON job_post_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_message_cleanup_queue_job_id ON job_message_cleanup_queue(job_id);
CREATE INDEX IF NOT EXISTS idx_job_message_cleanup_queue_business_id ON job_message_cleanup_queue(business_id);

-- Trigger to update thread's last_message_at when a message is added
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_post_threads
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON job_post_messages;
CREATE TRIGGER trigger_update_thread_last_message
  AFTER INSERT ON job_post_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Trigger to auto-update updated_at on threads
DROP TRIGGER IF EXISTS update_job_post_threads_updated_at ON job_post_threads;
CREATE TRIGGER update_job_post_threads_updated_at 
    BEFORE UPDATE ON job_post_threads
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE job_post_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_post_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_message_cleanup_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access threads" ON job_post_threads;
DROP POLICY IF EXISTS "Service role full access messages" ON job_post_messages;
DROP POLICY IF EXISTS "Service role full access cleanup queue" ON job_message_cleanup_queue;

-- Allow all operations on messaging tables (auth checked in API routes via JWT)
-- Since we're using custom JWT authentication (not Supabase Auth),
-- we allow all operations. Authentication is verified in API routes.
CREATE POLICY "Service role full access threads" ON job_post_threads
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages" ON job_post_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access cleanup queue" ON job_message_cleanup_queue
    FOR ALL USING (true) WITH CHECK (true);

