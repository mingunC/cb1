import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

// 답글 작성 스키마
const replySchema = z.object({
  reply_text: z.string().min(10, '답글은 최소 10자 이상이어야 합니다.').max(1000, '답글은 최대 1000자까지 가능합니다.')
})

// 사용자 인증 함수
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return { user, error }
  }
  
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// 리뷰에 답글 작성 (POST)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🚀 POST /api/reviews/[id]/reply 시작')
    
    // 인증된 사용자 확인
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      console.error('❌ 인증 실패')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const reviewId = params.id
    const body = await request.json()
    const validatedData = replySchema.parse(body)

    console.log('📦 답글 작성 요청:', { reviewId, userId: user.id })

    // 리뷰 정보 확인
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('id, contractor_id, contractor_reply, contractor_reply_date')
      .eq('id', reviewId)
      .single()

    if (reviewError || !reviewData) {
      console.error('❌ 리뷰를 찾을 수 없음:', reviewError)
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 답글이 있는지 확인
    if (reviewData.contractor_reply) {
      console.error('❌ 이미 답글이 존재함')
      return NextResponse.json({ error: '이미 답글을 작성하셨습니다.' }, { status: 400 })
    }

    // 해당 업체의 소유자인지 확인
    const { data: contractorData, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('id, user_id')
      .eq('id', reviewData.contractor_id)
      .single()

    if (contractorError || !contractorData) {
      console.error('❌ 업체 정보를 찾을 수 없음:', contractorError)
      return NextResponse.json({ error: '업체 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (contractorData.user_id !== user.id) {
      console.error('❌ 권한 없음 - 업체 소유자가 아님')
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    console.log('✅ 권한 확인 완료')

    // 답글 업데이트
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: validatedData.reply_text,
        contractor_reply_date: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ 답글 작성 오류:', updateError)
      return NextResponse.json({ error: '답글 작성에 실패했습니다.' }, { status: 500 })
    }

    console.log('✅ 답글 작성 성공:', updatedReview.id)

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: '답글이 성공적으로 작성되었습니다.'
    })

  } catch (error) {
    console.error('❌ 답글 작성 API 오류:', error)
    
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

// 답글 수정 (PATCH)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🚀 PATCH /api/reviews/[id]/reply 시작')
    
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const reviewId = params.id
    const body = await request.json()
    const validatedData = replySchema.parse(body)

    // 리뷰 정보 및 권한 확인
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        contractor_id,
        contractor_reply,
        contractors!inner(user_id)
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !reviewData) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!reviewData.contractor_reply) {
      return NextResponse.json({ error: '수정할 답글이 없습니다.' }, { status: 404 })
    }

    if ((reviewData.contractors as any).user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 답글 수정
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: validatedData.reply_text,
        contractor_reply_date: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: '답글 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: '답글이 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('❌ 답글 수정 API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 답글 삭제 (DELETE)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🚀 DELETE /api/reviews/[id]/reply 시작')
    
    const { user, error: authError } = await authenticateUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const reviewId = params.id

    // 권한 확인
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        contractor_id,
        contractor_reply,
        contractors!inner(user_id)
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !reviewData) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!reviewData.contractor_reply) {
      return NextResponse.json({ error: '삭제할 답글이 없습니다.' }, { status: 404 })
    }

    if ((reviewData.contractors as any).user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 답글 삭제 (null로 설정)
    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        contractor_reply: null,
        contractor_reply_date: null
      })
      .eq('id', reviewId)

    if (updateError) {
      return NextResponse.json({ error: '답글 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '답글이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('❌ 답글 삭제 API 오류:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
