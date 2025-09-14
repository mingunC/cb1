import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 데이터 검증
    const {
      spaceType,
      projectTypes,
      budget,
      timeline,
      postalCode,
      fullAddress,
      visitDates,
      details
    } = body

    if (!spaceType || !projectTypes || !budget || !timeline || !postalCode || !fullAddress) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    console.log('Supabase 클라이언트 생성 완료')
    console.log('환경 변수 확인:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락됨'
    })
    
    // 환경 변수 누락 시 오류 반환
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '서버 설정 오류: Supabase 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    
    // 현재 사용자 확인 (임시로 비활성화)
    let userId = crypto.randomUUID() // 실제 UUID 생성
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!authError && user) {
        userId = user.id
        console.log('인증된 사용자:', user.id, user.email)
      } else {
        console.log('인증되지 않은 사용자, 임시 UUID 사용:', userId)
      }
    } catch (authError) {
      console.log('인증 확인 실패, 임시 UUID 사용:', userId, authError)
    }

    // 데이터베이스 제약조건에 맞는 값들 사용 (변환 불필요)
    // budget, space_type, timeline 값들이 이미 데이터베이스 제약조건과 일치함

    // 삽입할 데이터 로깅
    const insertData = {
      customer_id: userId,
      space_type: spaceType,
      project_types: projectTypes,
      budget: budget,
      timeline: timeline,
      postal_code: postalCode,
      full_address: fullAddress,
      visit_dates: visitDates || [],
      description: details?.description || 'No description provided',
      photos: [],
      status: 'pending'
    }
    
    console.log('삽입할 데이터:', JSON.stringify(insertData, null, 2))

    // quote_requests 테이블에 데이터 저장 (실제 테이블 구조에 맞게)
    const { data, error } = await supabase
      .from('quote_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase 저장 오류 상세:', error)
      console.error('오류 코드:', error.code)
      console.error('오류 메시지:', error.message)
      console.error('오류 세부사항:', error.details)
      return NextResponse.json(
        { error: '데이터 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // TODO: 이메일 알림 발송 (Mailgun 연동)
    // TODO: 관리자에게 알림

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        message: '견적 요청이 성공적으로 저장되었습니다.'
      }
    })

  } catch (error) {
    console.error('POST API 오류 상세:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET 요청으로 임시 견적 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      )
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
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: '견적을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
