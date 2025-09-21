# Email Service Usage Guide

This guide explains how to use the new Mailgun-based email service for contractor selection notifications.

## 📦 What's Included

### 1. Core Email Service (`lib/email-service.ts`)
- Modern Mailgun.js integration
- Email template functions for contractor selection
- Commission calculation utilities
- Beautiful HTML email templates

### 2. Contractor Selection Helper (`lib/contractor-selection.ts`)
- High-level functions for sending both contractor and customer emails
- Type-safe interfaces for selection data
- Comprehensive error handling

### 3. API Endpoint (`app/api/contractor-selection/route.ts`)
- RESTful endpoint for triggering contractor selection emails
- Database integration to fetch contractor, customer, project, and quote data
- Automatic quote status updates

## 🚀 Quick Start

### 1. Environment Setup

Add these variables to your `.env.local`:

```env
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_DOMAIN_URL=https://api.mailgun.net
```

### 2. Install Dependencies

The required dependencies have been updated in `package.json`:

```bash
npm install
```

This will install:
- `mailgun.js` (modern Mailgun client)
- `form-data` (required by Mailgun.js)
- `@types/form-data` (TypeScript support)

### 3. Usage Examples

#### Basic Email Sending

```typescript
import { sendEmail } from '@/lib/email-service';

const result = await sendEmail({
  to: 'contractor@example.com',
  subject: 'Test Email',
  html: '<h1>Hello!</h1>',
  text: 'Hello!'
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

#### Contractor Selection (Recommended)

```typescript
import { sendContractorSelectionEmails } from '@/lib/contractor-selection';

const selectionData = {
  contractor: {
    id: 'contractor-uuid',
    email: 'contractor@example.com',
    name: '김철수',
    company_name: '우수 건설',
    contact_name: '김철수',
    phone: '010-1234-5678'
  },
  customer: {
    id: 'customer-uuid',
    email: 'customer@example.com',
    name: '이영희'
  },
  project: {
    id: 'project-uuid',
    project_type: '리모델링',
    space_type: '아파트',
    address: '서울시 강남구'
  },
  quote: {
    id: 'quote-uuid',
    price: 50000000
  }
};

const result = await sendContractorSelectionEmails(selectionData);
```

#### Using the API Endpoint

```javascript
const response = await fetch('/api/contractor-selection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractorId: 'contractor-uuid',
    customerId: 'customer-uuid',
    projectId: 'project-uuid',
    quoteId: 'quote-uuid'
  })
});

const result = await response.json();
```

## 📧 Email Templates

### Contractor Selection Email Features:
- 🎉 Congratulatory header
- 📋 Project information table
- 💰 Commission calculation and payment details
- 📌 Next steps guidance
- 🔗 Dashboard link

### Customer Notification Email Features:
- ✅ Selection confirmation
- 📋 Selected contractor information
- 🔗 MyPage link

## 🔧 Customization

### Updating Email Templates

Edit the template functions in `lib/email-service.ts`:

```typescript
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any
): string => {
  // Customize your HTML template here
  return `...`;
};
```

### Commission Calculation

Modify the commission rate in `lib/email-service.ts`:

```typescript
export const calculateCommission = (budget: number): string => {
  const commissionRate = 0.15; // Change from 10% to 15%
  // ...
};
```

### Adding New Email Types

1. Create new template functions in `email-service.ts`
2. Add corresponding helper functions in `contractor-selection.ts`
3. Extend the API endpoint or create new ones as needed

## 🔍 Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Check that `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set in `.env.local`

2. **"Mailgun API error"**
   - Verify your API key is correct
   - Check that your domain is verified in Mailgun dashboard

3. **"Database not found" errors**
   - Ensure your Supabase tables (contractors, users, quote_requests, contractor_quotes) exist
   - Check RLS policies allow access to the data

### Testing

Test email sending in development:

```typescript
// Test basic email functionality
import { sendEmail } from '@/lib/email-service';

const testResult = await sendEmail({
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  html: '<h1>Test successful!</h1>'
});
```

### Monitoring

Check Mailgun dashboard for:
- Email delivery status
- Bounce rates
- Open rates
- API usage

## 🔄 Migration from Old System

If you're migrating from the old `mailgun-js` setup:

1. ✅ Dependencies updated in `package.json`
2. ✅ New email service created
3. ✅ Environment variables documented
4. 🔄 Update existing email sending code to use new service
5. 🔄 Test all email functionality

## 📈 Production Considerations

1. **Rate Limits**: Mailgun has sending limits based on your plan
2. **Domain Verification**: Set up SPF, DKIM, and DMARC records
3. **Error Handling**: Implement retry logic for failed emails
4. **Monitoring**: Set up alerts for email delivery failures
5. **Templates**: Consider using Mailgun's template feature for complex emails

## 🔗 Related Files

- `lib/email-service.ts` - Core email functionality
- `lib/contractor-selection.ts` - Selection-specific helpers  
- `app/api/contractor-selection/route.ts` - API endpoint
- `package.json` - Updated dependencies
- `README.md` - Updated environment variables
- `SUPABASE_SETUP.md` - Updated setup instructions
