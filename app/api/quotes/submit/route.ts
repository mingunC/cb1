// ============================================
// 9. API 라우트 - 견적서 제출
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email/mailgun'
import { createQuoteSubmissionTemplate } from '@/lib/email/mailgun'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component에서 호출된 경우 무시
            }
          },
        },
      }
    )

    const { projectId, contractorId, price, description, pdfUrl, pdfFilename } = await request.json()

    // 필수 필드 검증
    if (!projectId || !contractorId || !price || !description) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 프로젝트가 비딩 상태인지 확인
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (project.status !== 'bidding') {
      return NextResponse.json(
        { error: '현재 프로젝트는 견적서 제출 단계가 아닙니다.' },
        { status: 400 }
      )
    }

    // 견적서 저장
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        price: parseFloat(price),
        description,
        pdf_url: pdfUrl,
        pdf_filename: pdfFilename,
        status: 'submitted'
      })
      .select()
      .single()

    if (quoteError) {
      console.error('견적서 저장 오류:', quoteError)
      return NextResponse.json(
        { error: '견적서 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 프로젝트 상태를 quote-submitted로 변경
    const { error: statusError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'quote-submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (statusError) {
      console.error('프로젝트 상태 업데이트 오류:', statusError)
      // 견적서는 저장되었으므로 경고만 로그
    }

    // ✅ 고객에게 견적서 제출 알림 이메일 발송
    let emailSent = false
    try {
      // 프로젝트 정보 가져오기 (고객 정보 포함)
      const { data: projectWithCustomer, error: projectFetchError } = await supabase
        .from('quote_requests')
        .select('*, customer_id')
        .eq('id', projectId)
        .single()

      if (!projectFetchError && projectWithCustomer) {
        // 고객 정보 가져오기
        const { data: customer, error: customerError } = await supabase
          .from('users')
          .select('first_name, last_name, email, phone')
          .eq('id', projectWithCustomer.customer_id)
          .single()

        // 업체 정보 가져오기
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('company_name, email, phone')
          .eq('id', contractorId)
          .single()

        if (customer && contractor && customer.email) {
          const customerName = customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.email?.split('@')[0] || 'Customer'

          const emailHTML = createQuoteSubmissionTemplate(
            customerName,
            {
              company_name: contractor.company_name,
              email: contractor.email,
              phone: contractor.phone
            },
            {
              full_address: projectWithCustomer.full_address,
              space_type: projectWithCustomer.space_type,
              budget: projectWithCustomer.budget
            },
            {
              price: parseFloat(price),
              description: description
            }
          )

          const emailResult = await sendEmail({
            to: customer.email,
            subject: '📋 New Quote Received for Your Project',
            html: emailHTML,
            replyTo: 'support@canadabeaver.pro'
          })

          if (emailResult.success) {
            emailSent = true
            console.log('✅ Quote submission email sent successfully:', {
              to: customer.email,
              messageId: (emailResult as any).messageId
            })
          } else {
            console.error('❌ Failed to send quote submission email:', emailResult.error)
          }
        }
      }
    } catch (emailError: any) {
      console.error('❌ Error sending quote submission email:', emailError)
      // 이메일 발송 실패해도 견적서 제출은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: quote,
      message: '견적서가 성공적으로 제출되었습니다.',
      emailSent: emailSent
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
