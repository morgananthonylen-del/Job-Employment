-- Add updated_at column to job_post_messages if it doesn't exist
ALTER TABLE job_post_messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at on message updates
DROP TRIGGER IF EXISTS update_job_post_messages_updated_at ON job_post_messages;
CREATE TRIGGER update_job_post_messages_updated_at 
  BEFORE UPDATE ON job_post_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();





