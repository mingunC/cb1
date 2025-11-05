// ============================================
// 9. API 라우트 - 견적서 제출 (이메일 전송 개선)
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

    // ✅ 개선된 이메일 전송 로직
    console.log('📧 이메일 전송 프로세스 시작')
    let emailSent = false
    let emailError: string | null = null

    try {
      // 1단계: 프로젝트 정보 가져오기
      console.log('📝 Step 1: 프로젝트 정보 조회 중...', { projectId })
      const { data: projectWithCustomer, error: projectFetchError } = await supabase
        .from('quote_requests')
        .select('*, customer_id')
        .eq('id', projectId)
        .single()

      if (projectFetchError) {
        throw new Error(`프로젝트 조회 실패: ${projectFetchError.message}`)
      }

      if (!projectWithCustomer) {
        throw new Error('프로젝트 정보를 찾을 수 없습니다.')
      }

      console.log('✅ 프로젝트 정보 조회 성공:', {
        projectId: projectWithCustomer.id,
        customerId: projectWithCustomer.customer_id
      })

      // 2단계: 고객 정보 가져오기
      console.log('📝 Step 2: 고객 정보 조회 중...', { customerId: projectWithCustomer.customer_id })
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone')
        .eq('id', projectWithCustomer.customer_id)
        .single()

      if (customerError) {
        throw new Error(`고객 정보 조회 실패: ${customerError.message}`)
      }

      if (!customer) {
        throw new Error('고객 정보를 찾을 수 없습니다.')
      }

      if (!customer.email) {
        throw new Error('고객 이메일 주소가 없습니다.')
      }

      console.log('✅ 고객 정보 조회 성공:', {
        email: customer.email,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      })

      // 3단계: 업체 정보 가져오기
      console.log('📝 Step 3: 업체 정보 조회 중...', { contractorId })
      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, email, phone')
        .eq('id', contractorId)
        .single()

      if (contractorError) {
        throw new Error(`업체 정보 조회 실패: ${contractorError.message}`)
      }

      if (!contractor) {
        throw new Error('업체 정보를 찾을 수 없습니다.')
      }

      console.log('✅ 업체 정보 조회 성공:', {
        companyName: contractor.company_name,
        email: contractor.email
      })

      // 4단계: 이메일 템플릿 생성
      console.log('📝 Step 4: 이메일 템플릿 생성 중...')
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

      console.log('✅ 이메일 템플릿 생성 완료')

      // 5단계: 이메일 전송
      console.log('📧 Step 5: 이메일 전송 중...', {
        to: customer.email,
        subject: '📋 New Quote Received for Your Project'
      })

      const emailResult = await sendEmail({
        to: customer.email,
        subject: '📋 New Quote Received for Your Project',
        html: emailHTML,
        replyTo: 'support@canadabeaver.pro'
      })

      if (emailResult.success) {
        emailSent = true
        console.log('✅✅✅ 이메일 전송 성공!', {
          to: customer.email,
          messageId: (emailResult as any).messageId,
          contractor: contractor.company_name,
          price: parseFloat(price)
        })
      } else {
        emailError = emailResult.error || '이메일 전송 실패 (원인 불명)'
        console.error('❌❌❌ 이메일 전송 실패:', {
          error: emailResult.error,
          to: customer.email,
          contractor: contractor.company_name
        })
      }

    } catch (error: any) {
      emailError = error.message || '이메일 전송 중 오류 발생'
      console.error('❌❌❌ 이메일 전송 프로세스 에러:', {
        error: error.message,
        stack: error.stack,
        projectId,
        contractorId
      })
    }

    // ✅ 응답 구성
    const response = {
      success: true,
      data: quote,
      message: '견적서가 성공적으로 제출되었습니다.',
      emailSent: emailSent,
      emailError: emailError
    }

    // 이메일 전송 실패 시에도 사용자에게 알림
    if (!emailSent && emailError) {
      console.warn('⚠️ 견적서는 제출되었으나 고객 이메일 전송에 실패했습니다:', emailError)
      response.message += ' (참고: 고객 이메일 알림 전송 실패)'
    }

    console.log('✅ 견적서 제출 완료:', response)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ API 오류:', {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
