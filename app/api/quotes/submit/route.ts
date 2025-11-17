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

    if (!projectId || !contractorId || !price) {
      throw ApiErrors.badRequest('필수 필드가 누락되었습니다.')
    }

    // ✅ contractor ID 검증
    if (contractor.id !== contractorId) {
      throw ApiErrors.forbidden('본인의 견적서만 제출할 수 있습니다.')
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
        contractorCompany: contractor.company_name
      })

    // ✅ 프로젝트 정보 가져오기 (timeline 포함)
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status, timeline')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw ApiErrors.notFound('프로젝트')
    }

    if (project.status !== 'bidding') {
      throw ApiErrors.badRequest('현재 프로젝트는 견적서 제출 단계가 아닙니다.')
    }

    // ✅ timeline 필드 포함하여 insert
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        price: parseFloat(price),
        timeline: project.timeline || 'TBD', // ✅ 프로젝트의 timeline 사용
        description: description || null,
        pdf_url: pdfUrl,
        status: 'submitted',
      })
      .select()
      .single()

    if (quoteError) {
      console.error('❌ Quote save error:', quoteError)
      throw ApiErrors.internal('견적서 저장에 실패했습니다.')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Quote saved successfully:', quote.id)
    }

    let emailSent = false
    let emailError: string | null = null

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Starting email notification process...')
      }

      const { data: projectWithCustomer, error: projectFetchError } = await supabase
        .from('quote_requests')
        .select('*, customer_id, full_address, space_type, budget')
        .eq('id', projectId)
        .single()

      if (projectFetchError || !projectWithCustomer) {
        throw new Error(projectFetchError?.message || '프로젝트 정보를 찾을 수 없습니다.')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Project info retrieved:', {
          hasCustomerId: !!projectWithCustomer.customer_id,
          address: projectWithCustomer.full_address?.slice(0, 20) + '...'
        })
      }

      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone')
        .eq('id', projectWithCustomer.customer_id)
        .single()

      if (customerError || !customer || !customer.email) {
        throw new Error(customerError?.message || '고객 이메일 주소가 없습니다.')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Customer info retrieved:', {
          hasEmail: !!customer.email,
          email: customer.email,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
        })
      }

      const { data: contractorInfo, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, email, phone')
        .eq('id', contractorId)
        .single()

      if (contractorError || !contractorInfo) {
        throw new Error(contractorError?.message || '업체 정보를 찾을 수 없습니다.')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 Contractor info retrieved:', {
          companyName: contractorInfo.company_name,
          hasEmail: !!contractorInfo.email
        })
      }

      const customerName =
        customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.email.split('@')[0] || 'Customer'

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Creating email template...')
      }

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

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Sending email to customer:', {
          to: customer.email,
          subject: 'New Quote Received for Your Project'
        })
      }

      const emailResult = await sendEmail({
        to: customer.email,
        subject: 'New Quote Received for Your Project',
        html: emailHTML,
      })

      if (emailResult.success) {
        emailSent = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Email sent successfully!', {
            messageId: (emailResult as any).messageId
          })
        }
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
      // ✅ 파일명 정보도 함께 반환 (클라이언트에서 사용할 수 있도록)
      pdfFilename,
    }

    const message = emailSent
      ? '견적서가 성공적으로 제출되었습니다.'
      : '견적서가 제출되었습니다. (참고: 고객 이메일 알림 전송 실패)'

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Quote submission completed:', {
        quoteId: quote.id,
        emailSent,
        emailError
      })
    }

    return successResponse(payload, message)
  },
})

export const POST = handler
