-- =====================================================
-- Fix sender_type CHECK constraint for job_post_messages
-- =====================================================
-- This fixes the constraint violation error when sending messages

-- First, let's check what constraints exist (for debugging)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'job_post_messages'::regclass 
-- AND conname LIKE '%sender_type%';

-- Drop ALL possible variations of the constraint
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'job_post_messages'::regclass 
        AND conname LIKE '%sender_type%'
    ) LOOP
        EXECUTE 'ALTER TABLE job_post_messages DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Verify the column exists and its type
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'job_post_messages' AND column_name = 'sender_type';

-- Recreate the constraint with the EXACT values: 'jobseeker' and 'business'
ALTER TABLE job_post_messages 
ADD CONSTRAINT job_post_messages_sender_type_check 
CHECK (sender_type IN ('jobseeker', 'business'));

-- Verify the constraint was created correctly
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'job_post_messages'::regclass 
-- AND conname = 'job_post_messages_sender_type_check';
