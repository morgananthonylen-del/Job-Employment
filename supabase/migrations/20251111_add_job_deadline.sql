-- Migration: add application deadline column to jobs

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;
-- Migration: add application deadline column to jobs

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;

