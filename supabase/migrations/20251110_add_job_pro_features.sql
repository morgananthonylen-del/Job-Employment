-- Add Pro Featured support to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN image_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name = 'promotion_tier'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN promotion_tier VARCHAR(10) NOT NULL DEFAULT 'free';
  END IF;

  -- Ensure promotion_tier only accepts valid values
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'jobs_promotion_tier_check'
      AND table_schema = 'public'
      AND table_name = 'jobs'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_promotion_tier_check
      CHECK (promotion_tier IN ('free', 'pro'));
  END IF;
END;
$$;






