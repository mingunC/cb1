import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 관리자 이메일 상수
const ADMIN_EMAIL = 'cmgg919@gmail.com'

// Supabase 클라이언트 생성 함수
async function createServerClient(request: Request) {
  const cookieStore = await cookies()
  
  // 모든 쿠키 로깅
  const allCookies = cookieStore.getAll()
  console.log('🍪 [API] All cookies:', allCookies.map(c => ({
    name: c.name,
    hasValue: !!c.value,
    valueLength: c.value?.length || 0
  })))
  
  // Authorization 헤더에서 토큰 가져오기
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  console.log('🔐 [API] Authorization 헤더 확인:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
  })
  
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle errors in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Handle errors in middleware
          }
        },
      },
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      }
    }
  )

  return supabase
}

// GET /api/admin/reviews - 모든 리뷰 조회
export async function GET(request: Request) {
  console.log('\n🔍 [API] ==================== GET /api/admin/reviews ====================')
  console.log('⏰ [API] Timestamp:', new Date().toISOString())
  
  try {
    const supabase = await createServerClient(request)
    
    // ✅ getUser()로 Authorization 헤더 토큰 검증
    console.log('🔍 [API] Checking user from token...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('📧 [API] User result:', {
      hasUser: !!user,
      email: user?.email || 'no-email',
      userId: user?.id || 'no-id',
      hasError: !!userError,
      errorMessage: userError?.message || 'no-error'
    })
    
    if (userError) {
      console.error('❌ [API] User error details:', userError)
      return NextResponse.json({ 
        error: 'Authentication error',
        details: userError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [API] No user found - invalid or expired token')
      return NextResponse.json({ 
        error: 'No session found',
        message: 'Please log in again'
      }, { status: 401 })
    }

    const userEmail = user.email
    console.log('📧 [API] User email from token:', userEmail)

    if (userEmail !== ADMIN_EMAIL) {
      console.error('❌ [API] User is not admin:', userEmail, 'Expected:', ADMIN_EMAIL)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ [API] Admin authorization successful:', userEmail)

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')
    const customerId = searchParams.get('customer_id')
    const hasReply = searchParams.get('has_reply')

    console.log('🔍 [API] Query parameters:', { contractorId, customerId, hasReply })

    // 리뷰 조회
    console.log('📊 [API] Building query...')
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
      console.log('🔍 [API] Filtering by contractor:', contractorId)
      query = query.eq('contractor_id', contractorId)
    }
    if (customerId) {
      console.log('🔍 [API] Filtering by customer:', customerId)
      query = query.eq('customer_id', customerId)
    }
    if (hasReply === 'true') {
      console.log('🔍 [API] Filtering: has reply')
      query = query.not('contractor_reply', 'is', null)
    } else if (hasReply === 'false') {
      console.log('🔍 [API] Filtering: no reply')
      query = query.is('contractor_reply', null)
    }

    console.log('📊 [API] Executing query...')
    const { data: reviews, error } = await query

    if (error) {
      console.error('❌ [API] Database error:', error)
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ [API] Successfully fetched ${reviews?.length || 0} reviews`)
    console.log('🔍 [API] ==================== END ====================\n')
    return NextResponse.json({ reviews: reviews || [] })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    console.error('❌ [API] Stack trace:', error.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/admin/reviews?id=xxx - 리뷰 삭제
export async function DELETE(request: Request) {
  console.log('\n🗑️ [API] ==================== DELETE /api/admin/reviews ====================')
  
  try {
    const supabase = await createServerClient(request)
    
    // ✅ getUser()로 토큰 검증
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ [API] No user for DELETE')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== ADMIN_EMAIL) {
      console.error('❌ [API] Not admin for DELETE:', user.email)
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
    console.log('🗑️ [API] ==================== END ====================\n')
    return NextResponse.json({ success: true, message: 'Review deleted successfully' })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/reviews - 리뷰 수정
export async function PATCH(request: Request) {
  console.log('\n✏️ [API] ==================== PATCH /api/admin/reviews ====================')
  
  try {
    const supabase = await createServerClient(request)
    
    // ✅ getUser()로 토큰 검증
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ [API] No user for PATCH')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== ADMIN_EMAIL) {
      console.error('❌ [API] Not admin for PATCH:', user.email)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 요청 본문 파싱 (rating 제거)
    const body = await request.json()
    const { id, title, comment, contractor_reply, is_verified } = body

    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    console.log('✏️ [API] Updating review:', id, 'with data:', { 
      hasTitle: !!title, 
      hasComment: !!comment, 
      hasReply: !!contractor_reply, 
      is_verified 
    })

    // 업데이트할 데이터 준비 (rating 제거)
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (comment !== undefined) updateData.comment = comment
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
    console.log('✏️ [API] ==================== END ====================\n')
    return NextResponse.json({ success: true, review: data })
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
