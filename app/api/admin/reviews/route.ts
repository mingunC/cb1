import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 관리자 이메일 상수
const ADMIN_EMAIL = 'cmgg919@gmail.com'

// GET /api/admin/reviews - 모든 리뷰 조회
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 권한 확인 (이메일 기반)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.email !== ADMIN_EMAIL) {
      console.error('❌ Not admin:', session.user.email)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin authorized:', session.user.email)

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')
    const customerId = searchParams.get('customer_id')
    const hasReply = searchParams.get('has_reply')

    // 리뷰 조회
    let query = supabase
      .from('reviews')
      .select(`
        id,
        contractor_id,
        customer_id,
        quote_id,
        rating,
        title,
        comment,
        photos,
        is_verified,
        created_at,
        contractor_reply,
        contractor_reply_date,
        contractors:contractor_id (
          id,
          company_name
        ),
        users:customer_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (contractorId) {
      query = query.eq('contractor_id', contractorId)
    }
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }
    if (hasReply === 'true') {
      query = query.not('contractor_reply', 'is', null)
    } else if (hasReply === 'false') {
      query = query.is('contractor_reply', null)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('❌ Error fetching reviews:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Fetched ${reviews?.length || 0} reviews`)
    return NextResponse.json({ reviews: reviews || [] })
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews?id=xxx - 리뷰 삭제
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 권한 확인 (이메일 기반)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 리뷰 ID 추출
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    console.log('🗑️ Deleting review:', reviewId)

    // 리뷰 삭제
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('❌ Error deleting review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Review deleted successfully')
    return NextResponse.json({ success: true, message: 'Review deleted successfully' })
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/reviews - 리뷰 수정
export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 권한 확인 (이메일 기반)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { id, title, comment, rating, contractor_reply, is_verified } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    console.log('✏️ Updating review:', id)

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (comment !== undefined) updateData.comment = comment
    if (rating !== undefined) updateData.rating = rating
    if (contractor_reply !== undefined) {
      updateData.contractor_reply = contractor_reply
      if (contractor_reply) {
        updateData.contractor_reply_date = new Date().toISOString()
      } else {
        updateData.contractor_reply_date = null
      }
    }
    if (is_verified !== undefined) updateData.is_verified = is_verified

    // 리뷰 수정
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Review updated successfully')
    return NextResponse.json({ success: true, review: data })
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
