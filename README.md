# Renovation Platform - Supabase Backend Setup

A comprehensive renovation platform connecting customers with contractors, built with Next.js 14, TypeScript, Supabase, and multi-language support.

## 🚀 Features

- **Multi-role Authentication**: Customer, Contractor, and Admin roles
- **Quote Management**: 5-step quote request process with temporary storage
- **Portfolio System**: Contractor project showcases with image galleries
- **Review System**: Customer reviews with verification
- **Event Management**: Admin-managed events and workshops
- **Image Processing**: Automatic compression and thumbnail generation
- **Multi-language Support**: Korean, English, Japanese, Chinese
- **Row Level Security**: Comprehensive RLS policies for data protection
- **Email Notifications**: Mailgun integration for notifications

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Mailgun account (for email notifications)
- Google OAuth credentials (optional)

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp env.local.example .env.local
```

Edit `.env.local` with your actual values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🗄️ Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings > API

### 2. Run Database Setup
Execute the SQL commands in `supabase-setup.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the entire contents of supabase-setup.sql
-- This will create all tables, RLS policies, indexes, and functions
```

### 3. Configure Authentication
In your Supabase dashboard:
1. Go to Authentication > Providers
2. Enable Email/Password authentication
3. Enable Google OAuth (configure with your Google OAuth credentials)

### 4. Set up Storage
1. Go to Storage in your Supabase dashboard
2. The `project-photos` bucket should be created automatically by the SQL script
3. Verify the bucket is public and has the correct policies

### 5. Create Admin User
After running the SQL setup, create your first admin user:

```sql
-- Replace with your actual admin email
UPDATE auth.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@domain.com';
```

## 🏗️ Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   └── images/       # Image compression endpoint
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase configuration
│   │   ├── clients.ts    # Client configurations
│   │   ├── hooks.ts      # React hooks
│   │   └── database.ts   # Database service
│   ├── types/            # TypeScript types
│   │   └── database.ts   # Database schema types
│   └── supabase.ts       # Main Supabase client
├── messages/             # Internationalization
│   ├── en.json          # English translations
│   └── ko.json          # Korean translations
├── supabase-setup.sql    # Complete database setup
└── env.local.example     # Environment variables template
```

## 🔧 Key Components

### Database Schema
- **quotes**: Approved quote requests
- **temp_quotes**: Draft quote requests (5-step process)
- **pros**: Contractor profiles
- **portfolios**: Project showcases
- **reviews**: Customer reviews
- **events**: Admin-managed events

### Authentication & Authorization
- Role-based access control (Customer, Contractor, Admin)
- Row Level Security (RLS) policies
- Google OAuth integration
- Password reset functionality

### Image Processing
- Automatic compression with Sharp
- Thumbnail generation
- 5MB file size limit
- Support for JPEG, PNG, WebP

### API Endpoints
- `POST /api/images` - Upload and compress images
- `GET /api/images` - Get image information
- `DELETE /api/images` - Delete images

## 🚀 Usage

### Starting the Development Server
```bash
npm run dev
```

### Using Supabase Client
```typescript
import { supabase, useAuth } from '@/lib/supabase'

// Get current user and role
const { user, role } = await useAuth()

// Upload image
const { data, error } = await uploadImage(file, 'project-photos', 'portfolios')
```

### Database Operations
```typescript
import { db } from '@/lib/supabase/database'

// Create a quote
const { data, error } = await db.createQuote({
  customer_id: userId,
  space_type: 'detached_house',
  project_types: ['kitchen', 'bathroom'],
  budget: '50k_100k',
  // ... other fields
})
```

## 🔒 Security Features

- **Row Level Security**: All tables have comprehensive RLS policies
- **Role-based Access**: Users can only access data appropriate to their role
- **File Upload Security**: Type and size validation
- **Environment Variables**: Sensitive data stored securely

## 🌐 Internationalization

The platform supports multiple languages:
- English (en)
- Korean (ko)
- Japanese (ja) - Add messages/ja.json
- Chinese (zh) - Add messages/zh.json

## 📧 Email Notifications

Configure Mailgun for email notifications:
- Quote submission notifications
- Contractor response notifications
- Status change notifications

## 🎨 Styling

The project uses:
- Tailwind CSS for styling
- Shadcn/ui components
- Custom CSS variables for theming

## 🚀 Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to your preferred platform:**
- Vercel (recommended for Next.js)
- Netlify
- AWS
- DigitalOcean

3. **Update environment variables** in your deployment platform

## 📝 API Documentation

### Image Upload API
```typescript
// POST /api/images
const formData = new FormData()
formData.append('file', imageFile)
formData.append('folder', 'portfolios')
formData.append('generateThumbnail', 'true')

const response = await fetch('/api/images', {
  method: 'POST',
  body: formData
})
```

## 🔧 Troubleshooting

### Common Issues

1. **Supabase connection errors**: Check your environment variables
2. **RLS policy errors**: Ensure policies are correctly set up
3. **Image upload failures**: Check file size and type restrictions
4. **Authentication issues**: Verify OAuth configuration

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the Supabase documentation
- Review the Next.js documentation

---

**Note**: This is a backend setup. Frontend components and pages are not included in this setup. You'll need to create the UI components separately.
