# Company Pages Setup Guide

## Overview
This feature allows admins to create SEO-friendly company pages with contact information, metadata, and monetization through Google Adsense and React Media promotion.

## Database Setup

1. **Run the migration script:**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase/migrations/20250120_add_company_pages.sql`

This will create the `company_pages` table with all necessary fields for:
- Company information (name, contact details, description)
- SEO metadata (title, description, keywords, OG image)
- URL slug for SEO-friendly URLs

## Admin Interface

1. **Access the admin panel:**
   - Navigate to `/admin/login`
   - Log in with admin credentials
   - Click on "Company Pages" in the sidebar

2. **Add a new company page:**
   - Click "Add Company Page"
   - Fill in company information:
     - **Company Name** (required)
     - **URL Slug** (required) - will be used as `/companyname`
     - Contact details (email, phone, address, website)
     - Company description
     - Logo URL
   - Fill in SEO metadata:
     - Meta Title (recommended: 50-60 characters)
     - Meta Description (recommended: 150-160 characters)
     - Meta Keywords (comma-separated)
     - Open Graph Image URL (for social media sharing)
   - Set active status
   - Click "Save Company Page"

3. **Edit/Delete company pages:**
   - Use the edit/delete buttons in the company pages list
   - View the page by clicking the external link icon

## Public Company Pages

Company pages are accessible at: `http://localhost:3000/{slug}`

For example, if you create a company with slug "acme-corporation", it will be accessible at:
`http://localhost:3000/acme-corporation`

## Google Adsense Setup

To enable Google Adsense ads on company pages:

1. **Get your Adsense Publisher ID:**
   - Sign up for Google Adsense at https://www.google.com/adsense
   - Get your publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)

2. **Set environment variables:**
   Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
   NEXT_PUBLIC_ADSENSE_SLOT_1=1234567890
   NEXT_PUBLIC_ADSENSE_SLOT_2=0987654321
   ```

3. **Get Ad Slot IDs:**
   - In your Adsense dashboard, create ad units
   - Copy the ad slot IDs
   - Replace the placeholder values in the environment variables

4. **Ad Placement:**
   - Ad Unit 1: Appears in the main content area (below contact information)
   - Ad Unit 2: Appears in the sidebar (below React Media promotion)

## React Media Promotion

The React Media promotion section appears in the sidebar of every company page, promoting your web development services.

To customize:
- Edit `app/[slug]/page.tsx`
- Find the "React Media Promotion" section
- Update the content, services list, or link as needed

## SEO Features

Each company page includes:
- ✅ Dynamic meta titles and descriptions
- ✅ Open Graph tags for social media sharing
- ✅ Twitter Card metadata
- ✅ Canonical URLs
- ✅ Structured data ready for search engines
- ✅ SEO-friendly URLs (`/companyname`)

## Reserved Routes

The following routes are reserved and will not be treated as company pages:
- `/admin`
- `/api`
- `/auth`
- `/login`
- `/register`
- `/business`
- `/jobseeker`
- `/resources`
- `/verify-email`
- `/resend-verification`

## API Endpoints

### Admin Endpoints (Protected)
- `GET /api/admin/company-pages` - List all company pages
- `POST /api/admin/company-pages` - Create new company page
- `GET /api/admin/company-pages/[id]` - Get single company page
- `PUT /api/admin/company-pages/[id]` - Update company page
- `DELETE /api/admin/company-pages/[id]` - Delete company page

### Public Endpoints
- `GET /api/company/[slug]` - Get company page by slug (public)

## Notes

- Company pages must be set to "Active" to be visible on the website
- Slugs must be unique and URL-friendly (lowercase, alphanumeric, hyphens only)
- The slug is automatically generated from the company name if not provided
- All company pages include Adsense ad units and React Media promotion

