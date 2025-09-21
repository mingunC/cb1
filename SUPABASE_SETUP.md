# Supabase Configuration for Renovation Platform

## Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_DOMAIN_URL=https://api.mailgun.net

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key from the project settings

### 2. Enable Authentication Providers
In your Supabase dashboard:
1. Go to Authentication > Providers
2. Enable Email/Password authentication
3. Enable Google OAuth (configure with your Google OAuth credentials)

### 3. Run Database Setup
Execute the SQL commands provided in `supabase-setup.sql` in your Supabase SQL editor.

### 4. Configure Storage
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `project-photos`
3. Set the bucket to public
4. Configure the policies as provided in the SQL file

### 5. Test the Setup
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Visit `http://localhost:3000` to test the application
