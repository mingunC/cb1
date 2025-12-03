import { createApiHandler } from '@/lib/api/handler'
import { successResponse } from '@/lib/api/response'
import { ApiErrors } from '@/lib/api/error'
import { requireContractor } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/server-clients'
import { sendEmail, createQuoteSubmissionTemplate, getQuoteSubmissionEmailSubject } from '@/lib/email/mailgun'
import { NextRequest } from 'next/server'

const handler = createApiHandler({
  POST: async (req: NextRequest) => {
    // ⚠️ CRITICAL: Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not configured!')
      console.error('Please add this environment variable to your .env.local file')
      throw ApiErrors.internal(
        'Server configuration error. Please contact support.'
      )
    }

    // ✅ requireContractor 사용 - contractors 테이블에서 검증
    const { user, contractor } = await requireContractor(req)
    const { projectId, contractorId, price, description, pdfUrl, pdfFilename } = await req.json()

    console.log('📥 Quote submission request:', {
      userId: user.id,
      contractorId,
      projectId,
      price,
      hasPdfUrl: !!pdfUrl,
      hasDescription: !!description,
    })

    if (!projectId || !contractorId || !price) {
      throw ApiErrors.badRequest('필수 필드가 누락되었습니다.')
    }

    // ✅ contractor ID 검증
    if (contractor.id !== contractorId) {
      console.error('❌ Contractor ID mismatch:', {
        authenticated: contractor.id,
        requested: contractorId,
      })
      throw ApiErrors.forbidden('본인의 견적서만 제출할 수 있습니다.')
    }

    const supabase = createAdminClient()

    // ✅ 프로젝트 상태 확인
    console.log('🔍 Fetching project info...')
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('❌ Project fetch error:', projectError)
      throw ApiErrors.notFound('프로젝트')
    }

    if (!project) {
      console.error('❌ Project not found')
      throw ApiErrors.notFound('프로젝트')
    }

    console.log('✅ Project found:', { status: project.status })

    if (project.status !== 'bidding') {
      throw ApiErrors.badRequest('현재 프로젝트는 견적서 제출 단계가 아닙니다.')
    }

    // ✅ 현장방문 완료 여부 확인 (필수 조건)
    console.log('🔍 Checking site visit completion...')
    const { data: siteVisit, error: siteVisitError } = await supabase
      .from('site_visits')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .eq('status', 'completed')
      .maybeSingle()

    if (siteVisitError) {
      console.error('❌ Site visit check error:', siteVisitError)
    }

    if (!siteVisit) {
      console.warn('⚠️ Site visit not completed for this contractor')
      throw ApiErrors.badRequest('현장방문을 완료해야 견적서를 제출할 수 있습니다. (Site visit must be completed before submitting a quote.)')
    }

    console.log('✅ Site visit verified:', { siteVisitId: siteVisit.id })

    // ✅ 중복 견적서 확인
    console.log('🔍 Checking for existing quotes...')
    const { data: existingQuote } = await supabase
      .from('contractor_quotes')
      .select('id')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single()

    if (existingQuote) {
      console.warn('⚠️ Duplicate quote attempt detected')
      throw ApiErrors.badRequest('이미 이 프로젝트에 견적서를 제출했습니다.')
    }

    // ✅ Insert할 데이터 준비
    const quoteData = {
      project_id: projectId,
      contractor_id: contractorId,
      price: parseFloat(price),
      description: description || null,
      pdf_url: pdfUrl,
      pdf_filename: pdfFilename || null,
      status: 'submitted',
    }

    console.log('📝 Inserting quote with data:', {
      ...quoteData,
      pdf_url: pdfUrl ? '(URL provided)' : null,
    })

    // ✅ contractor_quotes에 insert
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .insert(quoteData)
      .select()
      .single()

    if (quoteError) {
      console.error('❌ Quote save error:', {
        error: quoteError,
        message: quoteError.message,
        details: quoteError.details,
        hint: quoteError.hint,
        code: quoteError.code,
      })

      // 특정 에러에 대한 더 나은 메시지 제공
      if (quoteError.code === '23503') {
        throw ApiErrors.badRequest('유효하지 않은 프로젝트 또는 업체 ID입니다.')
      }
      if (quoteError.code === '42501') {
        throw ApiErrors.internal(
          'RLS 정책 오류. 관리자에게 문의하세요. (RLS policy violation)'
        )
      }

      throw ApiErrors.internal(`견적서 저장에 실패했습니다: ${quoteError.message}`)
    }

    console.log('✅ Quote saved successfully:', quote.id)

    let emailSent = false
    let emailError: string | null = null

    try {
      console.log('📧 Starting email notification process...')

      const { data: projectWithCustomer, error: projectFetchError } = await supabase
        .from('quote_requests')
        .select('*, customer_id, full_address, space_type, budget')
        .eq('id', projectId)
        .single()

      if (projectFetchError || !projectWithCustomer) {
        throw new Error(projectFetchError?.message || '프로젝트 정보를 찾을 수 없습니다.')
      }

      console.log('📋 Project info retrieved')

      // ✅ 고객 정보 + preferred_language 가져오기
      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('email, phone, first_name, last_name, preferred_language')
        .eq('id', projectWithCustomer.customer_id)
        .single()

      if (customerError || !customer || !customer.email) {
        console.error('❌ Customer fetch error:', customerError)
        throw new Error(customerError?.message || '고객 이메일 주소가 없습니다.')
      }

      // 고객 언어 설정 (기본값: 'en')
      const customerLocale = customer.preferred_language || 'en'

      console.log('👤 Customer email retrieved:', customer.email, 'locale:', customerLocale)

      const { data: contractorInfo, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, email, phone')
        .eq('id', contractorId)
        .single()

      if (contractorError || !contractorInfo) {
        throw new Error(contractorError?.message || '업체 정보를 찾을 수 없습니다.')
      }

      console.log('🏢 Contractor info retrieved')

      // 고객 이름 생성
      const customerName = customer.first_name && customer.last_name
        ? `${customer.first_name} ${customer.last_name}`
        : customer.email.split('@')[0] || 'Customer'

      // ✅ 고객의 선호 언어로 이메일 템플릿 생성
      const emailHTML = createQuoteSubmissionTemplate(
        customerName,
        {
          company_name: contractorInfo.company_name,
          email: contractorInfo.email,
          phone: contractorInfo.phone,
        },
        {
          full_address: projectWithCustomer.full_address,
          space_type: projectWithCustomer.space_type,
          budget: projectWithCustomer.budget,
        },
        {
          price: parseFloat(price),
          description: description || undefined,
        },
        customerLocale  // ✅ locale 전달
      )

      // ✅ 고객의 선호 언어로 이메일 제목 가져오기
      const emailSubject = getQuoteSubmissionEmailSubject(customerLocale)

      console.log('📧 Sending email to:', customer.email, 'with locale:', customerLocale)

      const emailResult = await sendEmail({
        to: customer.email,
        subject: emailSubject,
        html: emailHTML,
      })

      if (emailResult.success) {
        emailSent = true
        console.log('✅ Email sent successfully!')
      } else {
        emailError = emailResult.error || '이메일 전송 실패 (원인 불명)'
        console.error('❌ Email failed:', emailError)
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : '이메일 전송 중 오류 발생'
      console.error('❌ EMAIL PROCESS ERROR:', error)
    }

    const payload = {
      quote,
      emailSent,
      emailError,
      pdfFilename,
    }

    const message = emailSent
      ? '견적서가 성공적으로 제출되었습니다.'
      : '견적서가 제출되었습니다. (참고: 고객 이메일 알림 전송 실패)'

    console.log('✅ Quote submission completed:', {
      quoteId: quote.id,
      emailSent,
      hasEmailError: !!emailError,
    })

    return successResponse(payload, message)
  },
})

export const POST = handler
