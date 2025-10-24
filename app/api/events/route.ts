import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper function to create Supabase client for API routes
const createServerClient = async (request: NextRequest) => {
  const cookieStore = await cookies()
  
  // Authorization 헤더에서 토큰 가져오기
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
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
    }
  )

  // Authorization 헤더가 있으면 토큰으로 세션 설정
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // refresh_token은 필요하지 않음
    })
  }

  return supabase
}

// GET - 이벤트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const contractorId = searchParams.get('contractorId')

    let query = supabase
      .from('events')
      .select(`
        *,
        contractor:contractors(
          id,
          company_name,
          logo_url
        )
      `)
      .order('created_at', { ascending: false })

    // 타입 필터
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // 특별 이벤트 필터
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // 업체 필터
    if (contractorId) {
      query = query.eq('contractor_id', contractorId)
    }

    // 활성 이벤트만 (관리자가 아닌 경우)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      query = query.eq('is_active', true)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    // 상태 필터 (클라이언트 사이드)
    let filteredEvents = events || []
    if (status && status !== 'all') {
      const now = new Date()
      filteredEvents = filteredEvents.filter(event => {
        const startDate = new Date(event.start_date)
        const endDate = new Date(event.end_date)

        switch (status) {
          case 'ongoing':
            return startDate <= now && endDate >= now
          case 'upcoming':
            return startDate > now
          case 'ended':
            return endDate < now
          default:
            return true
        }
      })
    }

    return NextResponse.json({ events: filteredEvents })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 새 이벤트 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    
    console.log('🔍 사용자 인증 확인 시작')
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ 인증 실패:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ 인증 성공:', { userId: user.id, email: user.email })

    // 관리자 또는 업체 확인
    const isAdmin = user.email === 'cmgg919@gmail.com'
    console.log('🔍 관리자 확인:', { email: user.email, isAdmin })

    // 업체 정보 확인 (관리자가 아닌 경우)
    let contractorId = null
    if (!isAdmin) {
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (contractorError) {
        console.error('❌ 업체 정보 조회 실패:', contractorError)
      }

      if (!contractorData) {
        console.error('❌ 업체 정보 없음')
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 403 }
        )
      }
      contractorId = contractorData.id
      console.log('🏢 업체 ID:', contractorId)
    }

    const body = await request.json()

    // contractor_id 설정 (관리자가 지정하지 않은 경우)
    const eventData = {
      ...body,
      contractor_id: body.contractor_id || contractorId,
    }

    // 필수 필드 검증
    if (!eventData.title || !eventData.description || !eventData.type || 
        !eventData.image_url || !eventData.start_date || !eventData.end_date) {
      console.error('❌ 필수 필드 누락:', eventData)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📝 이벤트 생성 데이터:', eventData)

    const { data: event, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('❌ 이벤트 생성 실패:', error)
      return NextResponse.json(
        { error: 'Failed to create event: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ 이벤트 생성 성공:', event.id)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('❌ 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 이벤트 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.user_type === 'admin'

    // 업체인 경우 본인의 이벤트만 수정 가능
    if (!isAdmin) {
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!contractorData) {
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 403 }
        )
      }

      const { data: existingEvent } = await supabase
        .from('events')
        .select('contractor_id')
        .eq('id', id)
        .single()

      if (existingEvent?.contractor_id !== contractorData.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 이벤트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.user_type === 'admin'

    // 업체인 경우 본인의 이벤트만 삭제 가능
    if (!isAdmin) {
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!contractorData) {
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 403 }
        )
      }

      const { data: existingEvent } = await supabase
        .from('events')
        .select('contractor_id')
        .eq('id', id)
        .single()

      if (existingEvent?.contractor_id !== contractorData.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
