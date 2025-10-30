import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

// 리뷰 작성 스키마 - rating 제거
const reviewSchema = z.object({
  contractor_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  comment: z.string().min(10).max(1000),
  photos: z.array(z.string()).optional().default([])
})

// ✅ Authorization 헤더에서 사용자 인증
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Authorization 헤더로 인증
    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    console.log('🔐 Token 인증:', { user: user?.id, error: error?.message })
    return { user, error }
  }
  
  // 쿠키로 인증 (fallback)
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
  console.log('🔐 Cookie 인증:', { user: user?.id, error: error?.message })
  return { user, error }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/reviews 시작')
    
    // 인증된 사용자 확인
    const { user, error: authError } = await authenticateUser(request)
    
    console.log('🔐 리뷰 POST API - 인증 확인:', {
      user: user?.id,
      email: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      console.error('❌ 인증 실패')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Supabase 클라이언트 생성 (SERVICE ROLE KEY 사용)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 요청 데이터 파싱 및 검증
    const body = await request.json()
    console.log('📦 요청 바디:', JSON.stringify(body, null, 2))
    
    const validatedData = reviewSchema.parse(body)
    console.log('✅ 검증 완료:', {
      contractor_id: validatedData.contractor_id,
      title: validatedData.title.substring(0, 30) + '...'
    })

    // ✅ 고객이 한번이라도 견적요청을 한 적이 있는지 확인
    console.log('🔍 견적요청 이용 경험 확인 중...')
    const { data: userQuoteRequests, error: quoteRequestError } = await supabaseAdmin
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .limit(1)

    if (quoteRequestError || !userQuoteRequests || userQuoteRequests.length === 0) {
      console.error('❌ 견적요청 이용 경험 없음')
      return NextResponse.json({ 
        error: '견적요청을 이용한 경험이 있는 경우에만 리뷰를 작성할 수 있습니다.' 
      }, { status: 403 })
    }
    console.log('✅ 견적요청 이용 경험 확인 완료')

    // ✅ 해당 업체에 이미 리뷰를 남겼는지 확인
    console.log('🔍 중복 리뷰 확인 중...')
    const { data: existingReview, error: existingError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('contractor_id', validatedData.contractor_id)
      .eq('customer_id', user.id)
      .maybeSingle()

    console.log('🔍 중복 리뷰 확인 결과:', { 
      exists: !!existingReview,
      error: existingError?.message 
    })

    if (existingReview) {
      console.error('❌ 이미 리뷰가 존재함')
      return NextResponse.json({ 
        error: '이미 해당 업체에 대한 리뷰를 남기셨습니다.' 
      }, { status: 400 })
    }

    // ✅ 리뷰 생성 (rating 제거)
    console.log('💾 리뷰 생성 중...')
    const reviewInsertData = {
      contractor_id: validatedData.contractor_id,
      customer_id: user.id,
      quote_id: null,
      rating: null, // rating을 null로 설정
      title: validatedData.title,
      comment: validatedData.comment,
      photos: validatedData.photos,
      is_verified: true
    }
    
    console.log('💾 리뷰 데이터:', JSON.stringify(reviewInsertData, null, 2))
    
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert(reviewInsertData)
      .select()
      .single()

    if (reviewError) {
      console.error('❌ 리뷰 생성 오류:', {
        message: reviewError.message,
        details: reviewError.details,
        hint: reviewError.hint,
        code: reviewError.code
      })
      return NextResponse.json({ 
        error: '리뷰 생성에 실패했습니다.',
        details: reviewError.message 
      }, { status: 500 })
    }

    console.log('✅ 리뷰 생성 성공:', reviewData?.id)

    return NextResponse.json({ 
      success: true, 
      data: reviewData,
      message: '리뷰가 성공적으로 작성되었습니다.' 
    })

  } catch (error) {
    console.error('❌ 리뷰 POST API 오류:', error)
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod 검증 오류:', error.errors)
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

// ✅ GET 엔드포인트는 이제 필요 없음 (견적서 선택 불필요)
export async function GET(request: NextRequest) {
  try {
    // 인증된 사용자 확인
    const { user, error: authError } = await authenticateUser(request)
    
    console.log('🔐 리뷰 GET API - 인증 확인:', {
      user: user?.id,
      email: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 고객이 한번이라도 견적요청을 한 적이 있는지 확인
    const { data: userQuoteRequests, error: quoteRequestError } = await supabaseAdmin
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .limit(1)

    const hasQuoteRequests = userQuoteRequests && userQuoteRequests.length > 0

    return NextResponse.json({ 
      success: true, 
      hasQuoteRequests 
    })

  } catch (error) {
    console.error('견적요청 확인 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
