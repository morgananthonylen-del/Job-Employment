-- Ensure contact_preference exists on jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN contact_preference VARCHAR(20) NOT NULL DEFAULT 'message';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'jobs_contact_preference_check'
      AND table_schema = 'public'
      AND table_name = 'jobs'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_contact_preference_check
      CHECK (contact_preference IN ('message', 'call', 'both'));
  END IF;
END;
$$;






