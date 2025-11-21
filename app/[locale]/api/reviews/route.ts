import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'
import { requireRole } from '@/lib/api/auth'
import { ApiErrors } from '@/lib/api/error'
import { successResponse } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validation'
import { createAdminClient } from '@/lib/supabase/server-clients'

const reviewSchema = z.object({
  contractor_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  comment: z.string().min(10).max(1000),
  photos: z.array(z.string()).optional().default([]),
})

export const { GET, POST } = createApiHandler({
  GET: async (req) => {
    const { searchParams } = new URL(req.url)
    const contractorId = searchParams.get('contractor_id')

    if (!contractorId) {
      throw ApiErrors.badRequest('contractor_id is required')
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        id,
        title,
        comment,
        photos,
        created_at,
        customer:users!reviews_customer_id_fkey (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch reviews:', error)
      throw ApiErrors.internal('리뷰를 불러오는 중 오류가 발생했습니다.')
    }

    return successResponse(data || [])
  },

  POST: async (req) => {
    const { user, supabase } = await requireRole(['customer'])
    const body = await parseJsonBody(req, reviewSchema)

    const { data: userQuoteRequests, error: quoteRequestError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .limit(1)

    if (quoteRequestError || !userQuoteRequests || userQuoteRequests.length === 0) {
      throw ApiErrors.forbidden('견적요청을 이용한 경험이 있는 경우에만 리뷰를 작성할 수 있습니다.')
    }

    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('contractor_id', body.contractor_id)
      .eq('customer_id', user.id)
      .maybeSingle()

    if (existingError) {
      console.error('Duplicate check failed:', existingError)
      throw ApiErrors.internal('리뷰를 확인하는 중 오류가 발생했습니다.')
    }

    if (existingReview) {
      throw ApiErrors.badRequest('이미 해당 업체에 대한 리뷰를 남기셨습니다.')
    }

    const insertPayload = {
      contractor_id: body.contractor_id,
      customer_id: user.id,
      quote_id: null,
      rating: null,
      title: body.title,
      comment: body.comment,
      photos: body.photos,
      is_verified: true,
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert(insertPayload)
      .select()
      .single()

    if (reviewError) {
      console.error('Failed to insert review:', reviewError)
      throw ApiErrors.internal('리뷰 생성에 실패했습니다.')
    }

    return successResponse(reviewData, '리뷰가 성공적으로 작성되었습니다.', 201)
  },
})
