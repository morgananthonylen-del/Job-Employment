-- FastLink Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('jobseeker', 'business', 'admin')),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  is_banned BOOLEAN DEFAULT FALSE,
  banned_by UUID REFERENCES users(id),
  banned_at TIMESTAMP WITH TIME ZONE,
  
  -- Job Seeker fields
  name VARCHAR(255),
  birthday DATE,
  phone_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', '')),
  ethnicity VARCHAR(50) CHECK (ethnicity IN ('itaukei', 'indian', 'rotuman', 'others', '')),
  employment_status VARCHAR(20) CHECK (employment_status IN ('employed', 'unemployed', '')),
  employer_name TEXT,
  years_of_experience INTEGER DEFAULT 0,
  
  -- Business fields
  company_name VARCHAR(255),
  company_logo_url TEXT,
  
  -- Admin fields
  admin_level VARCHAR(20) CHECK (admin_level IN ('super', 'moderator')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job blocked applicants (many-to-many)
CREATE TABLE IF NOT EXISTS job_blocked_applicants (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, user_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  resume_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, job_seeker_id)
);

-- Application reviews table
CREATE TABLE IF NOT EXISTS application_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  note TEXT,
  ai_rating INTEGER CHECK (ai_rating BETWEEN 1 AND 5),
  ai_summary TEXT,
  ai_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business review progress table
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

-- Application documents table
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

-- Saved jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, job_seeker_id)
);

-- Settings table (for platform-wide settings)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_application_documents_status ON application_documents(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_documents_unique_path
  ON application_documents (application_id, storage_bucket, storage_path);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_seeker_id ON saved_jobs(job_seeker_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_reviews_updated_at BEFORE UPDATE ON application_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_review_progress_updated_at BEFORE UPDATE ON business_review_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at BEFORE UPDATE ON application_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_review_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Public can view active jobs
CREATE POLICY "Public can view active jobs" ON jobs
    FOR SELECT USING (is_active = TRUE);

-- Business owners can manage their jobs
CREATE POLICY "Business owners can manage jobs" ON jobs
    FOR ALL USING (business_id = auth.uid());

-- Job seekers can view their own applications
CREATE POLICY "Job seekers can view own applications" ON applications
    FOR SELECT USING (job_seeker_id = auth.uid());

-- Business owners can view applications for their jobs
CREATE POLICY "Business owners can view job applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = applications.job_id
            AND jobs.business_id = auth.uid()
        )
    );

-- Businesses manage reviews for their jobs
CREATE POLICY "Businesses manage reviews for their jobs" ON application_reviews
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            WHERE a.id = application_reviews.application_id
              AND j.business_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            WHERE a.id = application_reviews.application_id
              AND j.business_id = auth.uid()
        )
    );

-- Job seekers can view the outcome of their reviews
CREATE POLICY "Job seekers view their reviews" ON application_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = application_reviews.application_id
              AND a.job_seeker_id = auth.uid()
        )
    );

-- Businesses manage review progress state
CREATE POLICY "Businesses manage review progress" ON business_review_progress
    USING (business_id = auth.uid())
    WITH CHECK (business_id = auth.uid());

-- Businesses view processed application documents
CREATE POLICY "Businesses view application documents" ON application_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            WHERE a.id = application_documents.application_id
              AND j.business_id = auth.uid()
        )
    );

-- Job seekers view their uploaded documents
CREATE POLICY "Job seeker view their uploaded documents" ON application_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = application_documents.application_id
              AND a.job_seeker_id = auth.uid()
        )
    );

-- Service role manages application documents for processing
CREATE POLICY "Service role can manage application documents" ON application_documents
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');




