import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, status } = body

    if (process.env.NODE_ENV === 'development') console.log('Admin status update API called:', { projectId, status })

    // Supabase 서버 클라이언트 생성
    const supabase = createServerClient()

    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.email !== 'cmgg919@gmail.com') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 프로젝트 상태 업데이트
    const { data, error } = await supabase
      .from('quote_requests')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project status:', error)
      return NextResponse.json(
        { error: '프로젝트 상태 업데이트 실패', details: error.message },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'development') console.log('Successfully updated project status:', data)

    return NextResponse.json({ 
      success: true, 
      message: '프로젝트 상태가 업데이트되었습니다',
      project: data
    })

  } catch (error) {
    console.error('Admin status update API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 특정 프로젝트 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 프로젝트 정보와 관련 데이터 조회
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json(
        { error: '프로젝트 조회 실패' },
        { status: 404 }
      )
    }

    // contractor_quotes 조회
    const { data: quotes, error: quotesError } = await supabase
      .from('contractor_quotes')
      .select('*')
      .eq('project_id', projectId)

    if (process.env.NODE_ENV === 'development') console.log('Project status check:', {
      projectId,
      currentStatus: project.status,
      quotesCount: quotes?.length || 0,
      acceptedQuotes: quotes?.filter(q => q.status === 'accepted').length || 0
    })

    return NextResponse.json({
      project,
      quotes,
      hasAcceptedQuote: quotes?.some(q => q.status === 'accepted') || false
    })

  } catch (error) {
    console.error('Status check API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
