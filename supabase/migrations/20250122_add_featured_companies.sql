-- =====================================================
-- Add is_featured column to company_pages table
-- =====================================================

ALTER TABLE company_pages 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Index for featured companies
CREATE INDEX IF NOT EXISTS idx_company_pages_is_featured ON company_pages(is_featured);

-- Index for active and featured companies (common query)
CREATE INDEX IF NOT EXISTS idx_company_pages_active_featured ON company_pages(is_active, is_featured) 
WHERE is_active = true AND is_featured = true;

