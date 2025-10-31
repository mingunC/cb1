import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH: 고객이 자신의 리뷰 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const reviewId = params.id
    const body = await request.json()
    const { title, comment, rating } = body

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
      console.error('Review update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
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
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
      console.error('Review delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
