# Email Notifications Setup Guide

This guide explains how to set up email notifications for site visit applications and contractor selections.

## 📧 Email Notifications Overview

The system now supports two types of email notifications in English:

1. **Site Visit Application Notification** - Sent to customers when a contractor applies to visit their project site
2. **Contractor Selection Notification** - Sent to contractors when they are selected for a project

## 🛠️ Installation Steps

### Step 1: Deploy the Email Function

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Initialize Supabase in your project:
```bash
supabase init
```

3. Create the email function directory:
```bash
mkdir -p supabase/functions/send-email
mkdir -p supabase/functions/_shared
```

4. Copy the email function:
```bash
cp supabase-email-function-english.js supabase/functions/send-email/index.ts
```

5. Create a CORS helper file at `supabase/functions/_shared/cors.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

6. Deploy the function:
```bash
supabase functions deploy send-email
```

### Step 2: Set Environment Variables

1. Get your Resend API key from https://resend.com

2. Set the environment variables:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Run Database Migrations

1. **Add Site Visit Email Notification:**
```bash
psql -h your-db-host -U postgres -d your-database -f send-site-visit-application-email.sql
```

2. **Update Contractor Selection Email (English version):**
```bash
psql -h your-db-host -U postgres -d your-database -f send-contractor-selection-email-english.sql
```

Or run them directly in Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy and paste the contents of each SQL file
- Click "Run"

### Step 4: Update Edge Function URL

Update the Edge Function URL in both SQL files:

1. Find this line in both SQL files:
```sql
url := 'https://your-project-id.supabase.co/functions/v1/send-email',
```

2. Replace `your-project-id` with your actual Supabase project ID

3. To find your project ID:
   - Go to Supabase Dashboard
   - Look at the URL: `https://app.supabase.com/project/[YOUR-PROJECT-ID]`

## 📝 Email Templates

### Site Visit Application Email
- **Trigger:** When a contractor applies for a site visit
- **Recipient:** Customer who posted the project
- **Content:** Contractor information, project details, and action button

### Contractor Selection Email
- **Trigger:** When a customer selects a contractor's quote
- **Recipient:** Selected contractor
- **Content:** Congratulations message, project details, and payment instructions

## ⚙️ Configuration

### Customize Email Content

You can customize the email templates by editing the SQL functions:

1. **Site Visit Email:** Edit `send_site_visit_application_email()` function
2. **Selection Email:** Edit `send_contractor_selection_email()` function

The email templates use inline CSS for styling and are fully responsive.

### Customize Dashboard URLs

Update the dashboard URLs in the email templates:

```sql
<a href="https://your-renovation-site.com/customer/dashboard"
```

Replace with your actual domain.

## 🔍 Testing

### Test Site Visit Email

1. Log in as a contractor
2. Apply for a site visit on a project
3. Check the customer's email inbox

### Test Contractor Selection Email

1. Log in as a customer
2. Select a contractor's quote
3. Check the contractor's email inbox

### Check Email Logs

View email sending logs in Supabase:
```bash
supabase functions logs send-email
```

## 🐛 Troubleshooting

### Emails Not Being Sent

1. **Check Edge Function Logs:**
```bash
supabase functions logs send-email --tail
```

2. **Verify Environment Variables:**
```bash
supabase secrets list
```

3. **Check Database Triggers:**
```sql
SELECT * FROM pg_trigger WHERE tgname IN (
  'site_visit_application_email_trigger',
  'contractor_selection_email_trigger'
);
```

### Email in Spam Folder

- Configure SPF, DKIM, and DMARC records in your domain settings
- Use a verified sender domain in Resend
- Add a proper unsubscribe link

### Function Timeout

- Increase the function timeout in Supabase settings
- Optimize email content size
- Consider using a queue for email sending

## 📚 Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Resend API Documentation](https://resend.com/docs)
- [Email Template Best Practices](https://www.emailonacid.com/blog/article/email-development/email-development-best-practices)

## 🔒 Security Notes

1. Never commit your `RESEND_API_KEY` to version control
2. Use Supabase secrets management for sensitive data
3. Implement rate limiting for email sending
4. Validate email addresses before sending
5. Use SECURITY DEFINER carefully in SQL functions

## 📝 Migration from Korean to English

If you were using the Korean version before:

1. The new English functions will **replace** the old Korean functions
2. All new emails will be sent in English
3. Email history is not affected
4. Update any frontend text to match the new English emails

## ✅ Verification Checklist

- [ ] Edge function deployed successfully
- [ ] Environment variables set
- [ ] SQL migrations executed
- [ ] Edge function URL updated in SQL
- [ ] Dashboard URLs customized
- [ ] Test site visit email sent
- [ ] Test contractor selection email sent
- [ ] Email logs checked
- [ ] Spam filters checked
- [ ] Production domain configured

## 👥 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Verify your Resend account status
4. Check your email service quota

---

**Last Updated:** November 2025
**Version:** 2.0 (English)
