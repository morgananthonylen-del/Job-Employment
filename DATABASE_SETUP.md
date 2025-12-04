# FastLink Database Setup Guide

## Quick Start

1. **Go to your Supabase Dashboard**
   - Navigate to: SQL Editor
   - Click "New Query"

2. **Copy and paste the entire contents of `supabase/complete-schema.sql`**
   - This will create all tables, indexes, triggers, and initial data

3. **Run the SQL script**
   - Click "Run" or press Ctrl+Enter

4. **Set up Storage Bucket (for resumes)**
   - Go to Storage in Supabase Dashboard
   - Click "Create Bucket"
   - Name: `resumes`
   - Public: **false** (private)
   - File size limit: 10MB
   - Allowed MIME types: `image/png`, `image/jpeg`, `application/pdf`

## Database Tables Created

### 1. `users`
Stores all user accounts (job seekers, businesses, admins)
- **Fields**: id, user_type, email, password_hash, name, birthday, phone_number, address, city, gender, ethnicity, years_of_experience, company_name, admin_level, is_email_verified, is_banned, etc.

### 2. `jobs`
Stores job postings by businesses
- **Fields**: id, business_id, title, description, requirements, location, salary, job_type, is_active, created_at, updated_at

### 3. `job_blocked_applicants`
Junction table for blocking users from specific jobs
- **Fields**: job_id, user_id, blocked_at

### 4. `applications`
Stores job applications
- **Fields**: id, job_id, job_seeker_id, cover_letter, resume_url, status, reviewed_at, reviewed_by, notes, created_at

### 5. `settings`
Platform-wide settings
- **Fields**: key, value, description, updated_at, updated_by

## Indexes Created

All tables have appropriate indexes for:
- Email lookups
- User type filtering
- Job status filtering
- Application status filtering
- Foreign key relationships

## Features Included

✅ **Automatic timestamps** - `updated_at` auto-updates on record changes
✅ **Age calculation** - Function to calculate age from birthday
✅ **Data integrity** - Foreign keys and constraints
✅ **Performance** - Optimized indexes
✅ **Views** - Pre-built views for common queries
✅ **Initial settings** - AI feature enabled by default

## Verification

After running the schema, verify with:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check if settings were inserted
SELECT * FROM settings;

-- Test age calculation
SELECT calculate_age('1990-01-01'::DATE);
```

## Environment Variables Needed

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Creating Your First Admin User

After the schema is set up, create an admin user manually:

```sql
-- Replace with your desired admin credentials
INSERT INTO users (
  user_type,
  email,
  password_hash,
  name,
  is_email_verified,
  admin_level
) VALUES (
  'admin',
  'admin@fastlink.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash your password
  'Admin User',
  true,
  'super'
);
```

**To hash a password**, you can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the complete schema SQL
- Check that you're in the correct database

### Error: "permission denied"
- Check your Supabase project settings
- Ensure you're using the correct API keys

### RLS Policies
- The schema includes permissive policies for service role
- If you need stricter access control, modify the RLS policies
- For JWT-based auth, you may want to disable RLS on some tables

## Next Steps

1. ✅ Run the schema SQL
2. ✅ Set up storage bucket
3. ✅ Configure environment variables
4. ✅ Create first admin user
5. ✅ Test registration endpoints
6. ✅ Test login endpoints

Your database is now ready! 🎉










