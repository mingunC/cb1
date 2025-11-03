# Mailgun Email Integration Setup Guide

This guide explains how to set up email notifications using Mailgun instead of Resend.

## 🚀 Why Mailgun?

- Reliable email delivery service
- 5,000 free emails per month
- Advanced email tracking and analytics
- Support for multiple regions (US/EU)
- Easy domain verification

## 📋 Prerequisites

1. **Mailgun Account** - Sign up at https://mailgun.com
2. **Verified Domain** - Add and verify your sending domain
3. **Supabase Project** - Active Supabase project
4. **Supabase CLI** - Installed and configured

## 🔧 Step-by-Step Setup

### Step 1: Get Mailgun Credentials

1. Log in to [Mailgun Dashboard](https://app.mailgun.com/)
2. Go to **Sending** → **Domain Settings**
3. Select your domain (or use the sandbox domain for testing)
4. Copy the following:
   - **API Key** (from the "API Keys" section)
   - **Domain Name** (e.g., `mg.yourdomain.com` or sandbox domain)

### Step 2: Deploy the Email Function

1. **Create the function directory:**
```bash
mkdir -p supabase/functions/send-email
mkdir -p supabase/functions/_shared
```

2. **Create the CORS helper file:**

Create `supabase/functions/_shared/cors.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

3. **Copy the Mailgun function:**
```bash
cp supabase-email-function-mailgun.js supabase/functions/send-email/index.ts
```

4. **Deploy the function:**
```bash
supabase functions deploy send-email
```

### Step 3: Set Environment Variables

```bash
# Set your Mailgun API Key
supabase secrets set MAILGUN_API_KEY=your_mailgun_api_key_here

# Set your Mailgun domain
supabase secrets set MAILGUN_DOMAIN=mg.yourdomain.com

# Set the sender email (optional)
supabase secrets set FROM_EMAIL="Renovation Platform <noreply@yourdomain.com>"
```

**Finding Your API Key:**
- In Mailgun Dashboard → Settings → API Keys
- Use the **Private API Key** (starts with `key-`)

**Domain Options:**
- Production: `mg.yourdomain.com` (your verified domain)
- Testing: `sandbox[xxxxx].mailgun.org` (Mailgun sandbox)

### Step 4: Update SQL Functions

You need to update the Edge Function URL in your SQL files.

**Files to update:**
- `send-site-visit-application-email.sql`
- `send-contractor-selection-email-english.sql`

Find and replace:
```sql
url := 'https://your-project-id.supabase.co/functions/v1/send-email',
```

With your actual Supabase project URL:
```sql
url := 'https://abcdefghijk.supabase.co/functions/v1/send-email',
```

**To find your project ID:**
1. Go to Supabase Dashboard
2. Look at the URL: `https://app.supabase.com/project/[YOUR-PROJECT-ID]`
3. Or go to Settings → General → Project URL

### Step 5: Run Database Migrations

Run the SQL migrations in Supabase SQL Editor:

1. **Site Visit Notification:**
```sql
-- Copy and paste contents of send-site-visit-application-email.sql
```

2. **Contractor Selection Notification:**
```sql
-- Copy and paste contents of send-contractor-selection-email-english.sql
```

Or via command line:
```bash
psql -h db.abcdefghijk.supabase.co -U postgres -d postgres -f send-site-visit-application-email.sql
psql -h db.abcdefghijk.supabase.co -U postgres -d postgres -f send-contractor-selection-email-english.sql
```

## 🧪 Testing

### Test the Edge Function Directly

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from Mailgun",
    "html": "<h1>Hello from Mailgun!</h1><p>This is a test email.</p>",
    "contractor_name": "Test Contractor",
    "company_name": "Test Company"
  }'
```

### Test Site Visit Notification

1. Log in as a contractor
2. Apply for a site visit on a project
3. Check the customer's email inbox
4. Check Mailgun logs in the dashboard

### Test Contractor Selection Notification

1. Log in as a customer
2. Select a contractor's quote
3. Check the contractor's email inbox
4. Check Mailgun logs in the dashboard

## 📊 Monitoring & Analytics

### View Email Logs in Mailgun

1. Go to [Mailgun Dashboard](https://app.mailgun.com/)
2. Navigate to **Sending** → **Logs**
3. Filter by:
   - Date range
   - Recipient
   - Tags (e.g., `contractor-notification`)

### View Function Logs in Supabase

```bash
# View real-time logs
supabase functions logs send-email --tail

# View recent logs
supabase functions logs send-email
```

## 🌍 Regional Configuration

Mailgun has different API endpoints for different regions:

**US Region (default):**
```javascript
const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
```

**EU Region:**
```javascript
const mailgunUrl = `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
```

To use EU region:
1. Open `supabase/functions/send-email/index.ts`
2. Change the `mailgunUrl` to use `api.eu.mailgun.net`
3. Redeploy: `supabase functions deploy send-email`

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Enable IP restrictions** in Mailgun (if possible)
5. **Monitor email sending** for unusual activity
6. **Set up SPF and DKIM** for your domain

## 📧 Domain Verification

### Add Your Domain to Mailgun

1. In Mailgun Dashboard → **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter your domain (e.g., `mg.yourdomain.com`)
4. Follow the DNS setup instructions

### DNS Records to Add

Mailgun will provide you with DNS records to add:

**TXT Record (SPF):**
```
Type: TXT
Name: mg.yourdomain.com
Value: v=spf1 include:mailgun.org ~all
```

**TXT Record (DKIM):**
```
Type: TXT
Name: k1._domainkey.mg.yourdomain.com
Value: [provided by Mailgun]
```

**CNAME Record (Tracking):**
```
Type: CNAME
Name: email.mg.yourdomain.com
Value: mailgun.org
```

**MX Records:**
```
Type: MX
Priority: 10
Name: mg.yourdomain.com
Value: mxa.mailgun.org

Type: MX
Priority: 10
Name: mg.yourdomain.com
Value: mxb.mailgun.org
```

### Verify Domain

After adding DNS records:
1. Wait 24-48 hours for DNS propagation
2. Click **Verify DNS Settings** in Mailgun
3. Check verification status

## 🐛 Troubleshooting

### Error: "MAILGUN_API_KEY environment variable is not set"

**Solution:**
```bash
supabase secrets set MAILGUN_API_KEY=your_key
supabase secrets list  # Verify it's set
```

### Error: "MAILGUN_DOMAIN environment variable is not set"

**Solution:**
```bash
supabase secrets set MAILGUN_DOMAIN=mg.yourdomain.com
```

### Emails Going to Spam

**Solutions:**
1. Complete domain verification (SPF, DKIM, DMARC)
2. Warm up your sending domain gradually
3. Use a verified sender domain (not sandbox)
4. Add an unsubscribe link
5. Maintain good sender reputation

### Error: "Mailgun API error: Free accounts are for test purposes only"

**Solution:**
- Upgrade to a paid Mailgun plan, or
- Add authorized recipients in Mailgun Dashboard → Sending → Authorized Recipients

### Function Timeout

**Solution:**
1. Check Mailgun API status
2. Verify network connectivity
3. Increase function timeout in Supabase settings

### Wrong Region

**Solution:**
Check your Mailgun account region:
- US accounts: Use `api.mailgun.net`
- EU accounts: Use `api.eu.mailgun.net`

Update the `mailgunUrl` in the function accordingly.

## 💰 Pricing

### Mailgun Free Tier
- **5,000 emails/month** free
- **100 validations/month** free
- Perfect for development and small projects

### Paid Plans
- **Foundation:** $35/month - 50,000 emails
- **Growth:** $80/month - 100,000 emails
- **Scale:** Custom pricing

Visit [Mailgun Pricing](https://www.mailgun.com/pricing/) for details.

## 📚 Additional Resources

- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Mailgun API Reference](https://documentation.mailgun.com/en/latest/api-intro.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email Deliverability Best Practices](https://www.mailgun.com/resources/email-best-practices/)

## ✅ Setup Checklist

- [ ] Mailgun account created
- [ ] Domain added and verified in Mailgun
- [ ] API key obtained
- [ ] Supabase CLI installed
- [ ] Edge function deployed
- [ ] Environment variables set
- [ ] SQL migrations executed
- [ ] Function URL updated in SQL files
- [ ] Test email sent successfully
- [ ] Production emails working
- [ ] Email logs reviewed
- [ ] SPF/DKIM configured
- [ ] Monitoring set up

## 🆘 Need Help?

If you encounter issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [Mailgun logs](https://app.mailgun.com/app/logs)
3. Check [Supabase function logs](#-monitoring--analytics)
4. Contact Mailgun support: https://help.mailgun.com
5. Check Supabase Discord: https://discord.supabase.com

---

**Last Updated:** November 2025  
**Mailgun API Version:** v3  
**Supabase Functions:** Latest  
