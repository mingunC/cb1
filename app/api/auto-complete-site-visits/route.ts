import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
      .select('id, visit_date, visit_dates, customer_name')
      .eq('status', 'site-visit-pending')

    if (fetchError) {
      console.error('Error fetching projects to complete:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    if (!projectsToComplete || projectsToComplete.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('No site-visit-pending projects found')
      return NextResponse.json({ message: 'No site-visit-pending projects found', completed: 0 })
    }

    // 오늘 날짜와 일치하는 프로젝트들 필터링
    const matchingProjects = projectsToComplete.filter(project => {
      // visit_date가 오늘과 일치하는지 확인
      if (project.visit_date === todayString) {
        return true
      }
      
      // visit_dates 배열에 오늘 날짜가 포함되어 있는지 확인
      if (project.visit_dates && Array.isArray(project.visit_dates)) {
        return project.visit_dates.includes(todayString)
      }
      
      return false
    })

    if (matchingProjects.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('No projects match today\'s date')
      return NextResponse.json({ message: 'No projects match today\'s date', completed: 0 })
    }

    if (process.env.NODE_ENV === 'development') console.log('Found projects to complete:', matchingProjects.length)

    // 각 프로젝트를 현장방문 완료 상태로 변경
    const projectIds = matchingProjects.map(p => p.id)
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
      projectIds,
      projects: matchingProjects.map(p => ({ id: p.id, customer: p.customer_name }))
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

