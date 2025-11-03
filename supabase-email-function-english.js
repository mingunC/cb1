// Supabase Edge Function: send-email (ENGLISH VERSION)
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

    // Get email service settings from environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@renovation.com'

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Renovation Platform <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: html,
        tags: [
          {
            name: 'category',
            value: 'contractor-notification'
          },
          {
            name: 'contractor',
            value: company_name
          }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Email sending failed: ${error}`)
    }

    const emailResult = await emailResponse.json()

    // Log email sending (optional)
    console.log('Email sent successfully:', {
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
        message: 'Email sent successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
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
Deployment Instructions:
1. Install Supabase CLI: npm install -g supabase
2. Initialize project: supabase init
3. Create Edge Functions folder: mkdir -p supabase/functions/send-email
4. Save this file as supabase/functions/send-email/index.ts
5. Deploy: supabase functions deploy send-email
6. Set environment variables: 
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
*/
