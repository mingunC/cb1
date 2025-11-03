// Supabase Edge Function: send-email (MAILGUN VERSION)
// This file should be deployed as a Supabase Edge Function.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, contractor_name, company_name } = await req.json()

    // Get Mailgun settings from environment variables
    const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY')
    const MAILGUN_DOMAIN = Deno.env.get('MAILGUN_DOMAIN')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || `Renovation Platform <noreply@${MAILGUN_DOMAIN}>`

    if (!MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY environment variable is not set')
    }

    if (!MAILGUN_DOMAIN) {
      throw new Error('MAILGUN_DOMAIN environment variable is not set')
    }

    // Prepare form data for Mailgun API
    const formData = new FormData()
    formData.append('from', FROM_EMAIL)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('html', html)
    
    // Add tags for tracking
    formData.append('o:tag', 'contractor-notification')
    if (company_name) {
      formData.append('o:tag', `company:${company_name}`)
    }

    // Send email using Mailgun API
    const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
    
    const emailResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`),
      },
      body: formData,
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Mailgun API error: ${error}`)
    }

    const emailResult = await emailResponse.json()

    // Log email sending (optional)
    console.log('Email sent successfully via Mailgun:', {
      to,
      subject,
      contractor_name,
      company_name,
      messageId: emailResult.id
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        message: 'Email sent successfully via Mailgun' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error sending email via Mailgun:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/* 
Deployment Instructions for Mailgun:

1. Install Supabase CLI: 
   npm install -g supabase

2. Initialize project: 
   supabase init

3. Create Edge Functions folder: 
   mkdir -p supabase/functions/send-email
   mkdir -p supabase/functions/_shared

4. Save this file as: 
   supabase/functions/send-email/index.ts

5. Create CORS file at supabase/functions/_shared/cors.ts:
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }

6. Deploy the function: 
   supabase functions deploy send-email

7. Set environment variables: 
   supabase secrets set MAILGUN_API_KEY=your_mailgun_api_key
   supabase secrets set MAILGUN_DOMAIN=your_domain.com
   supabase secrets set FROM_EMAIL="Renovation Platform <noreply@your_domain.com>"

8. Find your Mailgun credentials:
   - Go to https://app.mailgun.com/
   - Navigate to Sending > Domain Settings
   - Copy your API Key and Domain name

9. Test the function:
   curl -X POST https://your-project-id.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<h1>Test</h1>",
       "company_name": "Test Company"
     }'

Mailgun Regions:
- US: https://api.mailgun.net (default)
- EU: https://api.eu.mailgun.net

If you're using EU region, update the mailgunUrl in the code:
const mailgunUrl = `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`
*/
