// Supabase Edge Function: send-email
// 이 파일을 Supabase의 Edge Functions로 배포해야 합니다.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, contractor_name, company_name } = await req.json()

    // 환경 변수에서 이메일 서비스 설정 가져오기
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@renovation.com'

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Resend API를 사용하여 이메일 발송
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `리노베이션 플랫폼 <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: html,
        tags: [
          {
            name: 'category',
            value: 'contractor-selection'
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

    // 이메일 발송 로그 저장 (선택사항)
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
배포 방법:
1. Supabase CLI 설치: npm install -g supabase
2. 프로젝트 초기화: supabase init
3. Edge Functions 폴더 생성: mkdir -p supabase/functions/send-email
4. 이 파일을 supabase/functions/send-email/index.ts로 저장
5. 배포: supabase functions deploy send-email
6. 환경 변수 설정: 
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
*/
