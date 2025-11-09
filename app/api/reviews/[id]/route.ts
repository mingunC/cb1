import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// PATCH: 고객이 자신의 리뷰 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.NODE_ENV === 'development') console.log('🔍 PATCH /api/reviews/[id] - Starting...')
    
    // 쿠키 디버깅
    const allCookies = request.cookies.getAll()
    if (process.env.NODE_ENV === 'development') console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Request 객체에서 직접 쿠키 읽기
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )
    
    if (process.env.NODE_ENV === 'development') console.log('🔍 Getting user session...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (process.env.NODE_ENV === 'development') console.log('🔍 Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', details: authError?.message },
        { status: 401 }
      )
    }

    const reviewId = params.id
    const body = await request.json()
    const { title, comment, rating } = body

    if (process.env.NODE_ENV === 'development') console.log('🔍 Review update request:', { reviewId, userId: user.id })

    // 리뷰 소유권 확인
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('id', reviewId)
      .single()

    if (process.env.NODE_ENV === 'development') console.log('🔍 Review ownership check:', { 
      review, 
      fetchError: fetchError?.message,
      matches: review?.customer_id === user.id
    })

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.customer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only edit your own reviews' },
        { status: 403 }
      )
    }

    // 리뷰 업데이트
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (comment !== undefined) updateData.comment = comment
    if (rating !== undefined) updateData.rating = rating

    const { error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)

    if (updateError) {
      console.error('❌ Review update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update review' },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'development') console.log('✅ Review updated successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 고객이 자신의 리뷰 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.NODE_ENV === 'development') console.log('🔍 DELETE /api/reviews/[id] - Starting...')
    
    // 쿠키 디버깅
    const allCookies = request.cookies.getAll()
    if (process.env.NODE_ENV === 'development') console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Request 객체에서 직접 쿠키 읽기
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (process.env.NODE_ENV === 'development') console.log('🔍 Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const reviewId = params.id

    // 리뷰 소유권 확인
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('id', reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.customer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only delete your own reviews' },
        { status: 403 }
      )
    }

    // 리뷰 삭제
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      console.error('❌ Review delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'development') console.log('✅ Review deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
