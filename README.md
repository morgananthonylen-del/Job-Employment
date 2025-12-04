# FastLink - Job Employment Platform

A modern job vacancy platform built with Next.js 15, Supabase, and shadcn/ui for connecting businesses with job seekers.

## Features

### For Job Seekers
- User-friendly registration with required fields (name, birthday, email, phone, address, city, gender, ethnicity)
- Browse and search job listings
- Create job applications with AI-powered assistance
- Build professional resumes using Canvas API
- Track application status
- Receive email notifications

### For Businesses
- Simple registration (name, email, phone, company name)
- Post, edit, and delete job listings
- View and manage applications
- Filter candidates by age, race, years of experience
- Block specific users from applying
- Review individual applications
- Email candidates (free)
- SMS notifications (paid feature - future)

### For Administrators
- Monitor user registrations (both job seekers and businesses)
- Ban/unban users
- Control AI feature availability
- View platform statistics
- Manage all jobs and applications

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email verification
- **Email**: Nodemailer
- **Resume Generation**: Canvas API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fastlink-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials and email configuration in `.env.local`.

4. Set up Supabase:

Create the following tables in your Supabase database:

- `users` - User accounts (job seekers, businesses, admins)
- `jobs` - Job listings
- `applications` - Job applications
- `settings` - Platform settings (optional)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fastlink-platform/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── business/          # Business dashboard
│   ├── jobseeker/         # Job seeker dashboard
│   └── api/               # API routes
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses Supabase (PostgreSQL). Key tables:

- **users**: Stores all user accounts with role-based access
- **jobs**: Job postings by businesses
- **applications**: Applications submitted by job seekers
- **settings**: Platform-wide settings

## Features in Development

- AI-powered application writing
- Canvas-based resume builder
- SMS notifications (paid feature)
- Advanced candidate filtering
- Analytics dashboard

## License

ISC

## Support

For support, email support@fastlink.com










