# Canada Beaver - Renovation Platform

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

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Supabase account
- Mailgun account (for email notifications)
- Google OAuth credentials (optional)

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/mingunC/cb1.git
cd cb1
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values (see [Environment Variables](#environment-variables))

3. **Start development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## 📁 Project Structure

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
├── next.config.js        # Next.js configuration
├── vercel.json          # Vercel deployment config
└── .env.example         # Environment variables template
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mailgun Configuration (Required for email)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Optional - for direct connection)
DATABASE_URL=your_database_connection_string

# Analytics (Optional)
# NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
# SENTRY_DSN=your_sentry_dsn
```

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run type-check      # Check TypeScript types
npm run format          # Format code with Prettier

# Analysis
npm run build:analyze   # Build with bundle analyzer
npm run clean           # Clean build artifacts
```

## 🚀 Deployment to Vercel

### Quick Deploy (Recommended)

1. **Push your code to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   MAILGUN_API_KEY
   MAILGUN_DOMAIN
   MAILGUN_FROM_EMAIL
   NEXT_PUBLIC_APP_URL  (set to your Vercel domain)
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `your-project.vercel.app`

### Manual Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Post-Deployment Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure custom domain in Vercel settings
- [ ] Update Supabase Auth site URL to your domain
- [ ] Update Mailgun sender domain
- [ ] Test all authentication flows
- [ ] Test image uploads
- [ ] Verify email notifications work
- [ ] Check all API routes
- [ ] Monitor error logs in Vercel dashboard

## 🔒 Security Features

- **Row Level Security**: All tables have comprehensive RLS policies
- **Role-based Access**: Users can only access data appropriate to their role
- **File Upload Security**: Type and size validation
- **Environment Variables**: Sensitive data stored securely
- **Security Headers**: XSS, clickjacking, and MIME-type sniffing protection
- **HTTPS Only**: Enforced in production

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

## 🔧 Performance Optimization

### Build Analysis
Analyze your bundle size:
```bash
npm run build:analyze
```

This will:
1. Build your production bundle
2. Generate an interactive bundle analysis
3. Open the results in your browser

### Image Optimization
- Images are automatically optimized with Next.js Image component
- Sharp is used for server-side image processing
- Multiple format support (AVIF, WebP, JPEG)
- Automatic responsive image generation

### Caching Strategy
- Static assets: 1 year cache
- API routes: No cache
- Images: CDN cached with automatic invalidation

## 🔧 Troubleshooting

### Common Issues

1. **Supabase connection errors**
   - Check your environment variables
   - Verify Supabase project is active
   - Check API keys are correct

2. **RLS policy errors**
   - Ensure policies are correctly set up
   - Check user role assignments
   - Verify auth.users table has correct roles

3. **Image upload failures**
   - Check file size (max 5MB)
   - Verify supported formats (JPEG, PNG, WebP)
   - Check Supabase storage bucket permissions

4. **Authentication issues**
   - Verify OAuth configuration
   - Check redirect URLs in Supabase
   - Ensure site URL matches your domain

5. **Build errors**
   - Run `npm run type-check` to find TypeScript errors
   - Run `npm run lint:fix` to fix linting issues
   - Clear `.next` folder and rebuild

### Debug Mode
Enable debug logging:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📊 Monitoring & Analytics

### Vercel Analytics
Built-in analytics available in Vercel dashboard:
- Page views
- Performance metrics
- Error tracking
- Geographic distribution

### Error Tracking
Recommended tools:
- Sentry (error monitoring)
- LogRocket (session replay)
- Vercel Logs (built-in)

## 🔄 Updates & Maintenance

### Keep Dependencies Updated
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update Next.js specifically
npm install next@latest
```

### Database Migrations
When updating the database schema:
1. Test in development first
2. Backup production database
3. Run migrations during low-traffic hours
4. Monitor for errors

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Next.js documentation](https://nextjs.org/docs)
- Check [Vercel documentation](https://vercel.com/docs)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time chat between customers and contractors
- [ ] AI-powered project cost estimation
- [ ] Advanced analytics dashboard
- [ ] Payment integration (Stripe)
- [ ] Video consultations
- [ ] Project management tools

---

**Built with ❤️ using Next.js 14, Supabase, and Tailwind CSS**
# Force deploy
