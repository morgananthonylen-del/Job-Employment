-- Migration: add review workflow tables for sequential applicant review and AI suggestions

-- Ensure uuid extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: application_reviews
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

-- Table: business_review_progress
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

-- Table: application_documents (stores extracted text/metadata for AI)
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_application_documents_unique_path
  ON application_documents (application_id, storage_bucket, storage_path);

CREATE INDEX IF NOT EXISTS idx_application_documents_status
  ON application_documents (status);

-- Reuse existing updated_at trigger
CREATE TRIGGER update_application_reviews_updated_at
  BEFORE UPDATE ON application_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_review_progress_updated_at
  BEFORE UPDATE ON business_review_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON application_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_review_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Policies for application_reviews
CREATE POLICY "Businesses manage reviews for their jobs" ON application_reviews
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = application_reviews.application_id
        AND j.business_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = application_reviews.application_id
        AND j.business_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers view their reviews" ON application_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      WHERE a.id = application_reviews.application_id
        AND a.job_seeker_id = auth.uid()
    )
  );

-- Policies for business_review_progress
CREATE POLICY "Businesses manage review progress" ON business_review_progress
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Policies for application_documents
CREATE POLICY "Businesses view application documents" ON application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = application_documents.application_id
        AND j.business_id = auth.uid()
    )
  );

CREATE POLICY "Job seeker view their uploaded documents" ON application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      WHERE a.id = application_documents.application_id
        AND a.job_seeker_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage application documents" ON application_documents
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

