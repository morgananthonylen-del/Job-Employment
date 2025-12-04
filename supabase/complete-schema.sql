-- =====================================================
-- FastLink Complete Database Schema for Supabase
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Stores all user accounts: job seekers, businesses, and admins
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication & Account Status
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('jobseeker', 'business', 'admin')),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  is_banned BOOLEAN DEFAULT FALSE,
  banned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  banned_at TIMESTAMP WITH TIME ZONE,
  
  -- Job Seeker Specific Fields
  name VARCHAR(255),
  birthday DATE,
  phone_number VARCHAR(50),
  address TEXT,
  additional_addresses TEXT[],
  city VARCHAR(100),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', '')),
  ethnicity VARCHAR(50) CHECK (ethnicity IN ('itaukei', 'indian', 'rotuman', 'others', '')),
  years_of_experience INTEGER DEFAULT 0,
  
  -- Business Specific Fields
  company_name VARCHAR(255),
  company_logo_url TEXT,
  website TEXT,
  
  -- Admin Specific Fields
  admin_level VARCHAR(20) CHECK (admin_level IN ('super', 'moderator')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. JOBS TABLE
-- =====================================================
-- Stores job postings by businesses
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location VARCHAR(255) NOT NULL,
  salary VARCHAR(100),
  job_type VARCHAR(20) DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  image_url TEXT,
  contact_preference VARCHAR(20) NOT NULL DEFAULT 'message' CHECK (contact_preference IN ('message', 'call', 'both')),
  promotion_tier VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (promotion_tier IN ('free', 'pro')),
  application_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. JOB_BLOCKED_APPLICANTS TABLE
-- =====================================================
-- Junction table for blocking specific users from applying to specific jobs
CREATE TABLE IF NOT EXISTS job_blocked_applicants (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (job_id, user_id)
);

-- =====================================================
-- 4. APPLICATIONS TABLE
-- =====================================================
-- Stores job applications submitted by job seekers
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Application Content
  cover_letter TEXT NOT NULL,
  resume_url TEXT,
  
  -- Application Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate applications
  UNIQUE(job_id, job_seeker_id)
);

-- =====================================================
-- 5. APPLICATION_REVIEWS TABLE
-- =====================================================
-- Stores manual and AI-assisted reviews for each application (one per application)
CREATE TABLE IF NOT EXISTS application_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Human feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  note TEXT,
  
  -- AI suggestion metadata
  ai_rating INTEGER CHECK (ai_rating BETWEEN 1 AND 5),
  ai_summary TEXT,
  ai_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. BUSINESS_REVIEW_PROGRESS TABLE
-- =====================================================
-- Tracks sequential review progress for businesses per job
CREATE TABLE IF NOT EXISTS business_review_progress (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_reviewed_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  reviewed_count INTEGER DEFAULT 0 CHECK (reviewed_count >= 0),
  total_applications INTEGER DEFAULT 0 CHECK (total_applications >= 0),
  resumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (job_id, business_id)
);

-- =====================================================
-- 7. APPLICATION_DOCUMENTS TABLE
-- =====================================================
-- Stores document metadata and extracted text for AI processing
CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  extracted_metadata JSONB,
  extracted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. SAVED_JOBS TABLE
-- =====================================================
-- Stores job bookmarks saved by job seekers
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, job_seeker_id)
);

-- =====================================================
-- 6. SETTINGS TABLE
-- =====================================================
-- Platform-wide settings (AI features, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_is_email_verified ON users(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);

ALTER TABLE IF EXISTS jobs
  ADD COLUMN IF NOT EXISTS contact_preference VARCHAR(20) NOT NULL DEFAULT 'message'
    CHECK (contact_preference IN ('message', 'call', 'both'));

ALTER TABLE IF EXISTS jobs
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;

-- Saved jobs indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_seeker_id ON saved_jobs(job_seeker_id);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Job blocked applicants indexes
CREATE INDEX IF NOT EXISTS idx_job_blocked_applicants_job_id ON job_blocked_applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_job_blocked_applicants_user_id ON job_blocked_applicants(user_id);

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate age from birthday
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ language 'plpgsql';

-- =====================================================
-- 8. TRIGGERS
-- =====================================================
-- Auto-update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_blocked_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Public can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Business owners can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Job seekers can view own applications" ON applications;
DROP POLICY IF EXISTS "Business owners can view job applications" ON applications;

-- Note: Since we're using JWT authentication (not Supabase Auth),
-- these policies are placeholders. You may need to adjust based on
-- your authentication implementation. For now, we'll allow service role
-- to bypass RLS or you can disable RLS if using JWT middleware.

-- Allow service role full access (for API routes)
-- This is safe if you're using JWT authentication in your API routes
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (true);

CREATE POLICY "Service role full access" ON jobs
    FOR ALL USING (true);

CREATE POLICY "Service role full access" ON applications
    FOR ALL USING (true);

CREATE POLICY "Service role full access" ON job_blocked_applicants
    FOR ALL USING (true);

CREATE POLICY "Service role full access" ON settings
    FOR ALL USING (true);

CREATE POLICY "Service role full access" ON saved_jobs
    FOR ALL USING (true);

-- =====================================================
-- 10. INITIAL DATA
-- =====================================================
-- Insert default settings
INSERT INTO settings (key, value, description) 
VALUES 
    ('ai_enabled', 'true', 'Enable AI-powered application writing for job seekers')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 11. STORAGE BUCKET SETUP (Run in Supabase Dashboard)
-- =====================================================
-- Go to Storage > Create Bucket
-- Bucket name: 'resumes'
-- Public: false (private bucket)
-- File size limit: 10MB
-- Allowed MIME types: image/png, image/jpeg, application/pdf

-- Or run this SQL to create the bucket programmatically:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'resumes',
--   'resumes',
--   false,
--   10485760, -- 10MB
--   ARRAY['image/png', 'image/jpeg', 'application/pdf']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
-- CREATE POLICY "Users can upload own resumes" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'resumes' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view own resumes" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'resumes' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- =====================================================
-- 12. VIEWS (Optional - for easier queries)
-- =====================================================
-- View for job listings with business info
CREATE OR REPLACE VIEW job_listings AS
SELECT 
    j.id,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.salary,
    j.job_type,
    j.is_active,
    j.created_at,
    j.updated_at,
    u.id as business_id,
    u.name as business_owner_name,
    u.company_name,
    u.email as business_email
FROM jobs j
INNER JOIN users u ON j.business_id = u.id
WHERE j.is_active = true;

-- View for applications with job and seeker info
CREATE OR REPLACE VIEW application_details AS
SELECT 
    a.id,
    a.cover_letter,
    a.resume_url,
    a.status,
    a.reviewed_at,
    a.notes,
    a.created_at,
    j.id as job_id,
    j.title as job_title,
    j.location as job_location,
    js.id as job_seeker_id,
    js.name as job_seeker_name,
    js.email as job_seeker_email,
    js.phone_number as job_seeker_phone,
    js.birthday as job_seeker_birthday,
    js.city as job_seeker_city,
    js.gender as job_seeker_gender,
    js.ethnicity as job_seeker_ethnicity,
    js.years_of_experience as job_seeker_experience,
    calculate_age(js.birthday) as job_seeker_age
FROM applications a
INNER JOIN jobs j ON a.job_id = j.id
INNER JOIN users js ON a.job_seeker_id = js.id;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your schema was created correctly:

-- Check all tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- Check all indexes
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Check all functions
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public'
-- ORDER BY routine_name;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

 