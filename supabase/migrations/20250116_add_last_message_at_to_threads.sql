-- Add last_message_at column to job_post_threads if it doesn't exist
ALTER TABLE job_post_threads 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_job_post_threads_last_message_at ON job_post_threads(last_message_at DESC);

-- Update existing threads to set last_message_at based on their most recent message
UPDATE job_post_threads t
SET last_message_at = (
  SELECT MAX(created_at)
  FROM job_post_messages m
  WHERE m.thread_id = t.id
)
WHERE EXISTS (
  SELECT 1
  FROM job_post_messages m
  WHERE m.thread_id = t.id
);

-- For threads without messages, keep the default NOW() value (which is their created_at)





