// ============================================
// 8. API 라우트 - 프로젝트 상태 변경
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest) {
  try {
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
              // Server Component에서 호출된 경우 무시
            }
          },
        },
      }
    )

    const { projectId, status } = await request.json()

    if (!projectId || !status) {
      return NextResponse.json(
        { error: '프로젝트 ID와 상태가 필요합니다.' },
        { status: 400 }
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
      console.error('프로젝트 상태 업데이트 오류:', error)
      return NextResponse.json(
        { error: '프로젝트 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 비딩 상태로 변경 시 현장방문 자동 완료
    if (status === 'bidding') {
      await supabase
        .from('site_visit_applications')
        .update({ 
          status: 'completed',
          notes: '비딩 단계 전환으로 자동 완료',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('status', 'pending')
    }

    return NextResponse.json({
      success: true,
      data,
      message: '프로젝트 상태가 성공적으로 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
