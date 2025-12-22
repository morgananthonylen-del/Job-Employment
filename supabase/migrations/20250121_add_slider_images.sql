-- =====================================================
-- Slider Images Table for Home Page Slider
-- =====================================================

CREATE TABLE IF NOT EXISTS slider_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Image Information
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  link_url TEXT,
  
  -- Display Settings
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slider_images_display_order ON slider_images(display_order);
CREATE INDEX IF NOT EXISTS idx_slider_images_is_active ON slider_images(is_active);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_slider_images_updated_at 
    BEFORE UPDATE ON slider_images
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API routes)
CREATE POLICY "Service role full access" ON slider_images
    FOR ALL USING (true);

