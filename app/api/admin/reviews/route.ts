import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 관리자 이메일 상수
const ADMIN_EMAIL = 'cmgg919@gmail.com'

// Supabase 클라이언트 생성 함수
function getSupabaseClient() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  console.log('🍪 [API] Cookies check:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0
  })

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      }
    }
  )
}

// GET /api/admin/reviews - 모든 리뷰 조회
export async function GET(request: Request) {
  console.log('🔍 [API] GET /api/admin/reviews - Starting...')
  
  try {
    const supabase = getSupabaseClient()
    
    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📧 [API] Session check:', {
      hasSession: !!session,
      email: session?.user?.email || 'no-email',
      userId: session?.user?.id || 'no-id',
      error: sessionError?.message || 'no-error'
    })
    
    if (sessionError) {
      console.error('❌ [API] Session error:', sessionError)
      return NextResponse.json({ error: 'Session error: ' + sessionError.message }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ [API] No session found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log('📧 [API] User email:', userEmail)

    if (userEmail !== ADMIN_EMAIL) {
      console.error('❌ [API] Not admin:', userEmail)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ [API] Admin authorized:', userEmail)

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')
    const customerId = searchParams.get('customer_id')
    const hasReply = searchParams.get('has_reply')

    console.log('🔍 [API] Query params:', { contractorId, customerId, hasReply })

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

    console.log('📊 [API] Executing query...')
    const { data: reviews, error } = await query

    if (error) {
      console.error('❌ [API] Error fetching reviews:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ [API] Fetched ${reviews?.length || 0} reviews`)
    return NextResponse.json({ reviews: reviews || [] })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews?id=xxx - 리뷰 삭제
export async function DELETE(request: Request) {
  console.log('🗑️ [API] DELETE /api/admin/reviews - Starting...')
  
  try {
    const supabase = getSupabaseClient()
    
    // 관리자 권한 확인 (이메일 기반)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ [API] No session for DELETE')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.email !== ADMIN_EMAIL) {
      console.error('❌ [API] Not admin for DELETE:', session.user.email)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 리뷰 ID 추출
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    console.log('🗑️ [API] Deleting review:', reviewId)

    // 리뷰 삭제
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('❌ [API] Error deleting review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [API] Review deleted successfully')
    return NextResponse.json({ success: true, message: 'Review deleted successfully' })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/reviews - 리뷰 수정
export async function PATCH(request: Request) {
  console.log('✏️ [API] PATCH /api/admin/reviews - Starting...')
  
  try {
    const supabase = getSupabaseClient()
    
    // 관리자 권한 확인 (이메일 기반)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ [API] No session for PATCH')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.email !== ADMIN_EMAIL) {
      console.error('❌ [API] Not admin for PATCH:', session.user.email)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { id, title, comment, rating, contractor_reply, is_verified } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    console.log('✏️ [API] Updating review:', id)

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
      console.error('❌ [API] Error updating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [API] Review updated successfully')
    return NextResponse.json({ success: true, review: data })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
