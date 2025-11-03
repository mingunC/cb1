# Email Notifications Update - English Version (with Mailgun)

## 🎉 What's New

This update adds comprehensive email notification features in English for both customers and contractors, now with **Mailgun integration**.

## ✨ New Features

### 1. Site Visit Application Email Notification 🏠

**When:** A contractor applies to visit a customer's project site  
**Recipient:** Customer (project owner)  
**Purpose:** Notify the customer that a contractor is interested in their project

**Email Contents:**
- Contractor company information
- Contact person details
- Contractor's specialties
- Project details summary
- Action button to review the application

**File:** `send-site-visit-application-email.sql`

### 2. Updated Contractor Selection Email 🎉

**When:** A customer selects a contractor's quote  
**Recipient:** Contractor (selected company)  
**Purpose:** Congratulate the contractor and provide next steps

**Email Contents:**
- Congratulations message
- Project information
- Selected quote amount
- Service fee payment instructions
- Link to contractor dashboard

**File:** `send-contractor-selection-email-english.sql`

## 📧 Email Service: Mailgun

This project uses **Mailgun** for email delivery:

### Why Mailgun?
- ✅ **5,000 free emails/month**
- ✅ Advanced tracking and analytics
- ✅ Reliable delivery rates
- ✅ Support for multiple regions (US/EU)
- ✅ Easy domain verification
- ✅ Excellent API documentation

### Alternative: Resend
If you prefer to use Resend instead of Mailgun:
- Use `supabase-email-function-english.js` (Resend version)
- Follow instructions in `EMAIL-NOTIFICATIONS-SETUP-GUIDE.md`

## 🔄 Changes from Previous Version

### Language Migration
- ❌ **Korean emails removed**
- ✅ **All emails now in English**
- Professional and clear email copy
- Improved email structure and formatting

### Email Service Integration
- ✅ **Mailgun integration added** (recommended)
- ✅ Alternative Resend integration available
- Updated Edge Function for Mailgun API
- Improved error logging in English

**Files:** 
- `supabase-email-function-mailgun.js` (Mailgun - recommended)
- `supabase-email-function-english.js` (Resend - alternative)

## 📊 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Language** | Korean (한국어) | English |
| **Site Visit Notifications** | ❌ None | ✅ Added |
| **Contractor Selection Email** | ✅ Korean | ✅ English |
| **Email Service** | Not specified | Mailgun (recommended) |
| **Email Templates** | Basic HTML | Responsive, professional design |
| **Customer Notifications** | Limited | Comprehensive |
| **Documentation** | Korean/Mixed | Full English documentation |

## 🛠️ Files Included

1. **send-site-visit-application-email.sql**
   - New SQL function for site visit notifications
   - Trigger on INSERT to site_visit_applications table

2. **send-contractor-selection-email-english.sql**
   - Updated English version of contractor selection email
   - Trigger on UPDATE to contractor_quotes table

3. **supabase-email-function-mailgun.js** ⭐ RECOMMENDED
   - Edge Function for Mailgun API
   - Improved error handling and logging
   - Supports US and EU regions

4. **supabase-email-function-english.js**
   - Alternative Edge Function for Resend API
   - Use if you prefer Resend over Mailgun

5. **MAILGUN-SETUP-GUIDE.md** 📚
   - Complete Mailgun setup instructions
   - Domain verification guide
   - Troubleshooting section

6. **EMAIL-NOTIFICATIONS-SETUP-GUIDE.md**
   - General setup instructions
   - Works with both Mailgun and Resend
   - Testing procedures

## 🚀 Quick Start (Mailgun)

### Step 1: Get Mailgun Credentials

1. Sign up at [Mailgun](https://www.mailgun.com)
2. Go to **Sending** → **Domain Settings**
3. Copy your **API Key** and **Domain Name**

### Step 2: Deploy the Email Function

```bash
# Create function directory
mkdir -p supabase/functions/send-email
mkdir -p supabase/functions/_shared

# Copy the Mailgun function
cp supabase-email-function-mailgun.js supabase/functions/send-email/index.ts

# Create CORS file
echo 'export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}' > supabase/functions/_shared/cors.ts

# Deploy
supabase functions deploy send-email
```

### Step 3: Set Environment Variables

```bash
supabase secrets set MAILGUN_API_KEY=your_mailgun_api_key
supabase secrets set MAILGUN_DOMAIN=mg.yourdomain.com
supabase secrets set FROM_EMAIL="Renovation Platform <noreply@yourdomain.com>"
```

### Step 4: Run Database Migrations

In Supabase SQL Editor, run:
1. `send-site-visit-application-email.sql`
2. `send-contractor-selection-email-english.sql`

**Important:** Update the function URL in both SQL files:
```sql
-- Replace this:
url := 'https://your-project-id.supabase.co/functions/v1/send-email',

-- With your actual project URL:
url := 'https://abcdefghijk.supabase.co/functions/v1/send-email',
```

### Step 5: Test

```bash
# Test the function
curl -X POST https://your-project-id.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1>",
    "company_name": "Test Company"
  }'
```

For detailed instructions, see [MAILGUN-SETUP-GUIDE.md](MAILGUN-SETUP-GUIDE.md)

## 📝 Sample Emails

### Site Visit Application Email Preview
```
Subject: 🏠 New Site Visit Application for Your Project

Hello, [Customer Name]!

[Contractor Company] has applied to visit your project site.
They are interested in providing you with a detailed quote...

[Contractor Information]
[Project Details]
[Action Button: View Application]
```

### Contractor Selection Email Preview
```
Subject: 🎉 Congratulations! You Have Been Selected

Hello, [Contractor Name]!

Your quote for the [Project Type] project has been selected!
The customer has chosen your company to work with.

[Project Information]
[Payment Instructions]
[Action Button: Go to Dashboard]
```

## 📊 Mailgun vs Resend Comparison

| Feature | Mailgun | Resend |
|---------|---------|--------|
| **Free Tier** | 5,000 emails/month | 100 emails/day (3,000/month) |
| **Pricing** | From $35/month | From $20/month |
| **Deliverability** | Excellent | Excellent |
| **Analytics** | Advanced | Basic |
| **Regions** | US, EU | US only |
| **API Complexity** | Moderate | Simple |
| **Documentation** | Extensive | Good |
| **Setup Time** | 15-30 minutes | 10-15 minutes |

**Recommendation:** Use **Mailgun** for production, especially if you need:
- Higher free tier limit
- Advanced analytics
- EU data residency
- Enterprise features

## 🔒 Security Features

- Secure function execution with SECURITY DEFINER
- Environment variable protection for API keys
- Email validation before sending
- Rate limiting support
- Audit logging for all email sends
- SPF/DKIM domain verification

## 📊 Analytics & Tracking

### Mailgun Dashboard
- Email delivery status
- Open and click tracking
- Bounce and complaint rates
- Detailed logs and filters

### Tagging
Emails are tagged for easy tracking:
- `contractor-notification` - Type of email
- `company:[name]` - Company name

View analytics at: https://app.mailgun.com/app/logs

## 🤝 Compatibility

- **Supabase:** All versions
- **PostgreSQL:** 12+
- **Mailgun API:** v3
- **Email Clients:** All major clients (Gmail, Outlook, Apple Mail, etc.)
- **Regions:** US and EU supported

## 🐛 Known Issues

1. **Mailgun Free Account Limits:** 
   - Can only send to authorized recipients
   - Upgrade to paid plan for production use

2. **DNS Propagation:** 
   - Domain verification can take 24-48 hours
   - Use sandbox domain for immediate testing

3. **Email Delays:** 
   - Typical delay is 1-5 seconds
   - Check Mailgun logs if delays exceed 30 seconds

4. **Spam Filters:** 
   - Configure SPF/DKIM for better deliverability
   - Warm up new sending domains gradually

See [MAILGUN-SETUP-GUIDE.md](MAILGUN-SETUP-GUIDE.md#-troubleshooting) for solutions.

## 🔮 Future Enhancements

- [ ] SMS notifications via Mailgun
- [ ] Email preferences dashboard
- [ ] Multiple language support
- [ ] Email templates customization UI
- [ ] Batch email sending
- [ ] Email scheduling
- [ ] A/B testing for email templates
- [ ] Webhook integration for delivery status

## 📚 Documentation

- **[MAILGUN-SETUP-GUIDE.md](MAILGUN-SETUP-GUIDE.md)** - Complete Mailgun setup
- **[EMAIL-NOTIFICATIONS-SETUP-GUIDE.md](EMAIL-NOTIFICATIONS-SETUP-GUIDE.md)** - General setup (Resend alternative)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Supabase Functions Docs](https://supabase.com/docs/guides/functions)

## ❓ FAQ

**Q: Why use Mailgun over Resend?**  
A: Mailgun offers 5,000 free emails/month (vs 3,000 for Resend) and has more advanced analytics.

**Q: Can I use my existing Mailgun account?**  
A: Yes! Just use your existing API key and domain.

**Q: Will this affect existing projects?**  
A: No, only new site visits and selections will trigger emails.

**Q: Can I customize the email templates?**  
A: Yes, edit the SQL functions to modify email content.

**Q: Do I need a paid Mailgun account?**  
A: Free tier works for development. Paid plan recommended for production.

**Q: Can I still use Resend instead?**  
A: Yes! Use `supabase-email-function-english.js` instead of the Mailgun version.

**Q: How do I switch from Resend to Mailgun?**  
A: Just redeploy the Edge Function with the Mailgun version and update environment variables.

**Q: What about EU data residency?**  
A: Mailgun supports EU region. Update the API endpoint in the function.

## 👏 Contributing

To improve these email notifications:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📦 Version History

**v2.1** (Current)
- Added Mailgun integration (recommended)
- Improved documentation
- Added regional support (US/EU)
- Enhanced error handling

**v2.0**
- Added site visit application notifications
- Migrated all emails to English
- Improved email design
- Added comprehensive documentation

**v1.0** (Previous)
- Basic contractor selection email (Korean)
- Simple email templates

## 💬 Support

If you need help:
- Check the [MAILGUN-SETUP-GUIDE.md](MAILGUN-SETUP-GUIDE.md)
- Review [Troubleshooting](MAILGUN-SETUP-GUIDE.md#-troubleshooting)
- Check [Mailgun logs](https://app.mailgun.com/app/logs)
- Contact Mailgun support: https://help.mailgun.com
- Email: support@renovation.com

---

**Created:** November 2025  
**Author:** Development Team  
**Email Service:** Mailgun (v3 API)  
**License:** MIT  
