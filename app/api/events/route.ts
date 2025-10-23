import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/clients'

// GET - 이벤트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const type = searchParams.get('type')
    const status = searchParams.get('status') // 'ongoing', 'upcoming', 'ended'
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
    const supabase = await createServerClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 관리자 또는 업체 확인
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.user_type === 'admin'

    // 업체 정보 확인 (관리자가 아닌 경우)
    let contractorId = null
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
      contractorId = contractorData.id
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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 이벤트 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
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
    const supabase = await createServerClient()
    
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
