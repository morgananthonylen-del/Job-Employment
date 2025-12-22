-- =====================================================
-- Company Pages Table for SEO-friendly company listings
-- =====================================================

CREATE TABLE IF NOT EXISTS company_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly name (e.g., "companyname")
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_address TEXT,
  website TEXT,
  company_logo_url TEXT,
  company_description TEXT,
  
  -- SEO Metadata
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_pages_slug ON company_pages(slug);
CREATE INDEX IF NOT EXISTS idx_company_pages_is_active ON company_pages(is_active);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_company_pages_updated_at 
    BEFORE UPDATE ON company_pages
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE company_pages ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API routes)
CREATE POLICY "Service role full access" ON company_pages
    FOR ALL USING (true);

