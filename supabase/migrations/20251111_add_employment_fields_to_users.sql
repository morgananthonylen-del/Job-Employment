ALTER TABLE users
  ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20)
    CHECK (employment_status IN ('employed', 'unemployed')) DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS employer_name TEXT;





