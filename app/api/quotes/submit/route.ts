import { createApiHandler } from '@/lib/api/handler'
import { successResponse } from '@/lib/api/response'
import { ApiErrors } from '@/lib/api/error'
import { requireRole } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/server-clients'
import { sendEmail, createQuoteSubmissionTemplate } from '@/lib/email/mailgun'

const handler = createApiHandler({
  POST: async (req) => {
    const { user } = await requireRole(['contractor'])
    const { projectId, contractorId, price, description, pdfUrl, pdfFilename } = await req.json()

    if (!projectId || !contractorId || !price) {
      throw ApiErrors.badRequest('필수 필드가 누락되었습니다.')
    }

    const supabase = createAdminClient()

    if (process.env.NODE_ENV === 'development')
      console.log('🎯 Quote submission received:', {
        projectId: projectId?.slice(0, 8),
        contractorId: contractorId?.slice(0, 8),
        price,
        hasPdf: !!pdfUrl,
        hasDescription: !!description,
        userId: user.id.slice(0, 8),
      })

    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw ApiErrors.notFound('프로젝트')
    }

    if (project.status !== 'bidding') {
      throw ApiErrors.badRequest('현재 프로젝트는 견적서 제출 단계가 아닙니다.')
    }

    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        price: parseFloat(price),
        description: description || null,
        pdf_url: pdfUrl,
        pdf_filename: pdfFilename,
        status: 'submitted',
      })
      .select()
      .single()

    if (quoteError) {
      console.error('❌ Quote save error:', quoteError)
      throw ApiErrors.internal('견적서 저장에 실패했습니다.')
    }

    let emailSent = false
    let emailError: string | null = null

    try {
      const { data: projectWithCustomer, error: projectFetchError } = await supabase
        .from('quote_requests')
        .select('*, customer_id, full_address, space_type, budget')
        .eq('id', projectId)
        .single()

      if (projectFetchError || !projectWithCustomer) {
        throw new Error(projectFetchError?.message || '프로젝트 정보를 찾을 수 없습니다.')
      }

      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone')
        .eq('id', projectWithCustomer.customer_id)
        .single()

      if (customerError || !customer || !customer.email) {
        throw new Error(customerError?.message || '고객 이메일 주소가 없습니다.')
      }

      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, email, phone')
        .eq('id', contractorId)
        .single()

      if (contractorError || !contractor) {
        throw new Error(contractorError?.message || '업체 정보를 찾을 수 없습니다.')
      }

      const customerName =
        customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.email.split('@')[0] || 'Customer'

      const emailHTML = createQuoteSubmissionTemplate(
        customerName,
        {
          company_name: contractor.company_name,
          email: contractor.email,
          phone: contractor.phone,
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

      const emailResult = await sendEmail({
        to: customer.email,
        subject: 'New Quote Received for Your Project',
        html: emailHTML,
      })

      if (emailResult.success) {
        emailSent = true
      } else {
        emailError = emailResult.error || '이메일 전송 실패 (원인 불명)'
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : '이메일 전송 중 오류 발생'
      console.error('❌ EMAIL PROCESS ERROR:', error)
    }

    const payload = {
      quote,
      emailSent,
      emailError,
    }

    const message = emailSent
      ? '견적서가 성공적으로 제출되었습니다.'
      : '견적서가 제출되었습니다. (참고: 고객 이메일 알림 전송 실패)'

    return successResponse(payload, message)
  },
})

export const POST = handler
