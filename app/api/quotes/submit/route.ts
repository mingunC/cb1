import { createApiHandler } from '@/lib/api/handler'
import { successResponse } from '@/lib/api/response'
import { ApiErrors } from '@/lib/api/error'
import { requireContractor } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/server-clients'
import { sendEmail, createQuoteSubmissionTemplate } from '@/lib/email/mailgun'
import { NextRequest } from 'next/server'

const handler = createApiHandler({
  POST: async (req: NextRequest) => {
    // ✅ requireContractor 사용 - contractors 테이블에서 검증
    const { user, contractor } = await requireContractor(req)
    const { projectId, contractorId, price, description, pdfUrl, pdfFilename } = await req.json()

    console.log('📥 Quote submission request:', {
      projectId,
      contractorId,
      price,
      hasPdfUrl: !!pdfUrl,
      hasDescription: !!description,
    })

    if (!projectId || !contractorId || !price) {
      throw ApiErrors.badRequest('필수 필드가 누락되었습니다.')
    }

    // ✅ contractor ID 검증
    if (contractor.id !== contractorId) {
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

    // ✅ Insert할 데이터 준비 (timeline 제거!)
    const quoteData = {
      project_id: projectId,
      contractor_id: contractorId,
      price: parseFloat(price),
      description: description || null,
      pdf_url: pdfUrl,
      pdf_filename: pdfFilename || null,
      status: 'submitted',
    }

    console.log('📝 Inserting quote with data:', quoteData)

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
        code: quoteError.code
      })
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

      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('email, phone')
        .eq('id', projectWithCustomer.customer_id)
        .single()

      if (customerError || !customer || !customer.email) {
        console.error('❌ Customer fetch error:', customerError)
        throw new Error(customerError?.message || '고객 이메일 주소가 없습니다.')
      }

      console.log('👤 Customer email retrieved:', customer.email)

      const { data: contractorInfo, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, email, phone')
        .eq('id', contractorId)
        .single()

      if (contractorError || !contractorInfo) {
        throw new Error(contractorError?.message || '업체 정보를 찾을 수 없습니다.')
      }

      console.log('🏢 Contractor info retrieved')

      const customerName = customer.email.split('@')[0] || 'Customer'

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
          description: description || 'No additional details provided',
        }
      )

      console.log('📧 Sending email to:', customer.email)

      const emailResult = await sendEmail({
        to: customer.email,
        subject: 'New Quote Received for Your Project',
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
      hasEmailError: !!emailError
    })

    return successResponse(payload, message)
  },
})

export const POST = handler
