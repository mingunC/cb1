# Simple Setup Guide - Email Notifications in English

## What This Does

This update adds two features:

1. **Site Visit Application Email** - When a contractor applies to visit a customer's project site, the customer gets an email notification
2. **English Email Templates** - All emails are now in English instead of Korean

## Quick Setup (5 Steps)

### Step 1: Replace the Email Service File

**Replace this file:**
```
lib/email-service.ts
```

**With this file from the branch:**
```
lib/email-service-english.ts
```

**How to do it:**
1. Download `lib/email-service-english.ts` from GitHub
2. Rename it to `lib/email-service.ts`
3. Replace the old file in your project

OR use git:
```bash
cd /path/to/your/project
git checkout feature/site-visit-email-notifications -- lib/email-service-english.ts
mv lib/email-service-english.ts lib/email-service.ts
```

### Step 2: Add Site Visit API Route

**Create a new folder:**
```
app/api/apply-site-visit/
```

**Add this file:**
```
app/api/apply-site-visit/route.ts
```

**How to do it:**
1. Download `app/api/apply-site-visit/route.ts` from GitHub branch
2. Copy it to your project in the correct folder

OR use git:
```bash
git checkout feature/site-visit-email-notifications -- app/api/apply-site-visit/route.ts
```

### Step 3: Update Database (Already Done If You Have `site_visit_applications` Table)

Check if you already have the table:
```sql
SELECT * FROM site_visit_applications LIMIT 1;
```

If you get an error, run this in Supabase SQL Editor:
```sql
-- Create site_visit_applications table
CREATE TABLE IF NOT EXISTS site_visit_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, contractor_id)
);

-- Enable RLS
ALTER TABLE site_visit_applications ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Contractors can view their own applications" ON site_visit_applications
FOR SELECT TO authenticated
USING (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "Contractors can create applications" ON site_visit_applications
FOR INSERT TO authenticated
WITH CHECK (contractor_id IN (SELECT id FROM contractors WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view applications for their projects" ON site_visit_applications
FOR SELECT TO authenticated
USING (project_id IN (SELECT id FROM quote_requests WHERE customer_id = auth.uid()));
```

### Step 4: Verify Mailgun is Working

Check your `.env.local` file has:
```bash
MAILGUN_API_KEY=key-xxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_DOMAIN_URL=https://api.mailgun.net
```

If you're using EU region:
```bash
MAILGUN_DOMAIN_URL=https://api.eu.mailgun.net
```

### Step 5: Test It!

**Test contractor selection email:**
1. Log in as a customer
2. Select a contractor for a project
3. Check the contractor's email - should be in English now

**Test site visit application email:**
1. Log in as a contractor
2. Apply for a site visit on a project
3. Check the customer's email - they should receive a notification

## That's It!

Your email notifications are now in English and site visit applications will trigger emails to customers.

## Troubleshooting

### Emails not sending?

1. Check Mailgun credentials:
```bash
echo $MAILGUN_API_KEY
echo $MAILGUN_DOMAIN
```

2. Check Mailgun logs:
   - Go to https://app.mailgun.com
   - Navigate to Sending → Logs
   - Look for your emails

3. Check your application logs:
```bash
npm run dev
# or
vercel logs
```

### Site visit API not working?

1. Make sure the file exists at:
   `app/api/apply-site-visit/route.ts`

2. Make sure you imported the email service:
   ```typescript
   import { sendEmail, createSiteVisitNotificationTemplate } from '@/lib/email-service-english'
   ```

3. After creating the file, you need to change the import to:
   ```typescript
   import { sendEmail, createSiteVisitNotificationTemplate } from '@/lib/email-service'
   ```
   (once you renamed `email-service-english.ts` to `email-service.ts`)

### Still in Korean?

Make sure you:
1. Replaced `lib/email-service.ts` with the English version
2. Restarted your development server
3. Cleared your browser cache

## File Checklist

- [ ] `lib/email-service.ts` - Replaced with English version
- [ ] `app/api/apply-site-visit/route.ts` - Created new file
- [ ] Database table `site_visit_applications` - Created (if needed)
- [ ] Mailgun credentials - Verified in `.env.local`
- [ ] Server restarted
- [ ] Tested contractor selection email (English)
- [ ] Tested site visit application email

## What Changed

### Before:
- Emails in Korean (한글)
- No site visit application emails
- Commission in KRW

### After:
- All emails in English
- Site visit applications trigger email to customer
- Commission in USD
- Professional English email templates

## Support

If you need help:
1. Check the [MAILGUN-SETUP-GUIDE.md](MAILGUN-SETUP-GUIDE.md) for detailed Mailgun setup
2. Check the [Pull Request](https://github.com/mingunC/cb1/pull/4) for all changes
3. Check Mailgun logs at https://app.mailgun.com

---

**Created:** November 2025  
**Branch:** `feature/site-visit-email-notifications`  
