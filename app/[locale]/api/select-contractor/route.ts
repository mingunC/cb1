import { createApiHandler } from '@/lib/api/handler'
import { requireRole } from '@/lib/api/auth'
import { ApiErrors } from '@/lib/api/error'
import { successResponse } from '@/lib/api/response'

interface SelectContractorBody {
  projectId?: string
  contractorId?: string
  quoteId?: string
}

export const POST = createApiHandler({
  POST: async (req) => {
    const { user, supabase } = await requireRole(['customer'])
    const body = (await req.json()) as SelectContractorBody
    const { projectId, contractorId, quoteId } = body

    if (!projectId || !contractorId || !quoteId) {
      throw ApiErrors.badRequest('Missing required fields')
    }

    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status, selected_contractor_id, customer_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw ApiErrors.notFound('프로젝트')
    }

    if (project.customer_id !== user.id) {
      throw ApiErrors.forbidden()
    }

    if (project.selected_contractor_id) {
      throw ApiErrors.badRequest('이미 다른 업체가 선택되었습니다')
    }

    if (project.status !== 'bidding') {
      throw ApiErrors.badRequest('현재 프로젝트는 견적서 제출 단계가 아닙니다')
    }

    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'bidding-closed',
        selected_contractor_id: contractorId,
        selected_quote_id: quoteId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('❌ 프로젝트 업데이트 에러:', updateError)
      throw ApiErrors.internal('업체 선택에 실패했습니다')
    }

    const { error: quoteError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId)

    if (quoteError) {
      console.error('❌ 견적서 업데이트 에러:', quoteError)
      throw ApiErrors.internal('견적서 상태 업데이트에 실패했습니다')
    }

    const { error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .neq('id', quoteId)

    if (rejectError) {
      console.error('⚠️ 다른 견적서 rejected 처리 실패:', rejectError)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    let emailSent = false
    let emailError: string | null = null

    try {
      const emailResponse = await fetch(`${baseUrl}/api/send-selection-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, contractorId }),
      })

      if (emailResponse.ok) {
        emailSent = true
      } else {
        emailError = `Email service responded with ${emailResponse.status}`
      }
    } catch (error) {
      console.error('❌ 이메일 발송 에러:', error)
      emailError = error instanceof Error ? error.message : '이메일 발송 중 오류 발생'
    }

    const message = emailSent
      ? '업체가 선택되었습니다. 축하 이메일이 발송됩니다.'
      : '업체가 선택되었습니다. (참고: 축하 이메일 발송 실패)'

    return successResponse(
      {
        projectStatus: 'bidding-closed',
        emailSent,
        emailError,
      },
      message
    )
  },
})
