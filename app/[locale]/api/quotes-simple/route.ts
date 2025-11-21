import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // 간단한 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    if (process.env.NODE_ENV === 'development') console.log('Supabase 클라이언트 생성 완료')
    if (process.env.NODE_ENV === 'development') console.log('환경 변수 확인:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨'
    })
    
    // 임시 사용자 ID 생성 (실제 UUID)
    const userId = crypto.randomUUID()

    // budget 값 변환
    const budgetMapping: { [key: string]: string } = {
      'under_50k': 'under-50000',
      '50k_100k': '50000-100000', 
      'over_100k': 'over-100000'
    }
    
    // space_type 값 변환
    const spaceTypeMapping: { [key: string]: string } = {
      'detached_house': 'detached-house',
      'town_house': 'town-house',
      'condo': 'condo',
      'commercial': 'commercial'
    }
    
    // timeline 값 변환
    const timelineMapping: { [key: string]: string } = {
      'immediate': 'immediate',
      '1_month': '1month',
      '3_months': '3months',
      'planning': 'planning'
    }
    
    const mappedBudget = budgetMapping[budget] || budget
    const mappedSpaceType = spaceTypeMapping[spaceType] || spaceType
    const mappedTimeline = timelineMapping[timeline] || timeline

    // quote_requests 테이블에 데이터 저장
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        customer_id: userId,
        space_type: mappedSpaceType,
        project_types: projectTypes,
        budget: mappedBudget,
        timeline: mappedTimeline,
        postal_code: postalCode,
        full_address: fullAddress,
        visit_date: visitDates && visitDates.length > 0 ? visitDates[0] : null,
        description: details?.description || '',
        photos: [],
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase 저장 오류 상세:', error)
      console.error('오류 코드:', error.code)
      console.error('오류 메시지:', error.message)
      console.error('오류 세부사항:', error.details)
      return NextResponse.json(
        { error: '데이터 저장에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

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
