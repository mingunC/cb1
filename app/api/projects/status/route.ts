// ============================================
// 8. API 라우트 - 프로젝트 상태 변경
// ============================================
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'
import { requireAuth } from '@/lib/api/auth'
import { ApiErrors } from '@/lib/api/error'
import { successResponse } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validation'
import { createAdminClient } from '@/lib/supabase/server-clients'

const projectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.string(),
})

export const PATCH = createApiHandler({
  PATCH: async (req) => {
    const { user } = await requireAuth()
    const { projectId, status } = await parseJsonBody(req, projectStatusSchema)

    const supabase = createAdminClient()

    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('customer_id, selected_contractor_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw ApiErrors.notFound('Project')
    }

    const isOwner = project.customer_id === user.id

    if (!isOwner) {
      throw ApiErrors.forbidden()
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update project status:', error)
      throw ApiErrors.internal('프로젝트 상태 업데이트에 실패했습니다.')
    }

    if (status === 'bidding') {
      await supabase
        .from('site_visit_applications')
        .update({
          status: 'completed',
          notes: '비딩 단계 전환으로 자동 완료',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('status', 'pending')
    }

    return successResponse(data, '프로젝트 상태가 성공적으로 업데이트되었습니다.')
  },
})
