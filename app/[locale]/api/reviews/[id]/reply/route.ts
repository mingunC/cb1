import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const replySchema = z.object({
  reply_text: z.string().min(10, '답글은 최소 10자 이상이어야 합니다.').max(1000, '답글은 최대 1000자까지 가능합니다.')
})

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: new Error('인증 토큰이 없습니다.') }
  }

  const token = authHeader.substring(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { user, error }
}

// 답글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    // 인증 확인
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 해당 리뷰 확인
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('contractor_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업체 소유자 확인
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('user_id')
      .eq('id', review.contractor_id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json({ error: '업체 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (contractor.user_id !== user.id) {
      return NextResponse.json({ error: '답글을 작성할 권한이 없습니다.' }, { status: 403 })
    }

    // 답글 내용 검증
    const body = await request.json()
    const { reply_text } = replySchema.parse(body)

    // 답글 저장
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: reply_text,
        contractor_reply_date: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('답글 저장 오류:', updateError)
      return NextResponse.json({ 
        error: '답글 저장에 실패했습니다.',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedReview,
      message: '답글이 작성되었습니다.' 
    })

  } catch (error) {
    console.error('답글 작성 API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 답글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    // 인증 확인
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 해당 리뷰 확인
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('contractor_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업체 소유자 확인
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('user_id')
      .eq('id', review.contractor_id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json({ error: '업체 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (contractor.user_id !== user.id) {
      return NextResponse.json({ error: '답글을 수정할 권한이 없습니다.' }, { status: 403 })
    }

    // 답글 내용 검증
    const body = await request.json()
    const { reply_text } = replySchema.parse(body)

    // 답글 수정
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: reply_text,
        contractor_reply_date: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('답글 수정 오류:', updateError)
      return NextResponse.json({ 
        error: '답글 수정에 실패했습니다.',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedReview,
      message: '답글이 수정되었습니다.' 
    })

  } catch (error) {
    console.error('답글 수정 API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 답글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    // 인증 확인
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 해당 리뷰 확인
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('contractor_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업체 소유자 확인
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('user_id')
      .eq('id', review.contractor_id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json({ error: '업체 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (contractor.user_id !== user.id) {
      return NextResponse.json({ error: '답글을 삭제할 권한이 없습니다.' }, { status: 403 })
    }

    // 답글 삭제 (null로 설정)
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: null,
        contractor_reply_date: null
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('답글 삭제 오류:', updateError)
      return NextResponse.json({ 
        error: '답글 삭제에 실패했습니다.',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedReview,
      message: '답글이 삭제되었습니다.' 
    })

  } catch (error) {
    console.error('답글 삭제 API 오류:', error)

    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
