import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options })
            } catch {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // 현재 날짜 (12am 기준)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayString = today.toISOString().split('T')[0]

    if (process.env.NODE_ENV === 'development') console.log('Checking for site visits to complete on:', todayString)

    // 오늘 날짜에 해당하는 현장방문 대기 상태의 프로젝트들 찾기
    const { data: projectsToComplete, error: fetchError } = await supabase
      .from('quote_requests')
      .select('id, visit_date, visit_dates')
      .eq('status', 'site-visit-pending')
      .or(`visit_date.eq.${todayString},visit_dates.cs.{${todayString}}`)

    if (fetchError) {
      console.error('Error fetching projects to complete:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    if (!projectsToComplete || projectsToComplete.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('No projects to complete today')
      return NextResponse.json({ message: 'No projects to complete today', completed: 0 })
    }

    if (process.env.NODE_ENV === 'development') console.log('Found projects to complete:', projectsToComplete.length)

    // 각 프로젝트를 현장방문 완료 상태로 변경
    const projectIds = projectsToComplete.map(p => p.id)
    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'site-visit-completed',
        updated_at: new Date().toISOString()
      })
      .in('id', projectIds)

    if (updateError) {
      console.error('Error updating project status:', updateError)
      return NextResponse.json({ error: 'Failed to update project status' }, { status: 500 })
    }

    if (process.env.NODE_ENV === 'development') console.log(`Successfully completed ${projectIds.length} site visits`)

    return NextResponse.json({ 
      message: 'Site visits completed successfully', 
      completed: projectIds.length,
      projectIds 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

