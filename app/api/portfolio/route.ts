import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 400 })
    }

    // 포트폴리오 프로젝트 조회
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Portfolio fetch error:', error)
      return NextResponse.json({ error: '포트폴리오 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ projects: data || [] })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { contractor_id, title, description, image_url, category, year } = body

    // 업체 정보 확인
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', contractor_id)
      .eq('user_id', user.id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 포트폴리오 프로젝트 생성
    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert({
        contractor_id,
        title,
        description,
        image_url,
        category,
        year: parseInt(year)
      })
      .select()
      .single()

    if (error) {
      console.error('Portfolio creation error:', error)
      return NextResponse.json({ error: '포트폴리오 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      project: data 
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, image_url, category, year } = body

    // 포트폴리오 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        contractor_id,
        contractors!inner(user_id)
      `)
      .eq('id', id)
      .single()

    if (projectError || !project || project.contractors.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 포트폴리오 프로젝트 업데이트
    const { data, error } = await supabase
      .from('portfolio_projects')
      .update({
        title,
        description,
        image_url,
        category,
        year: parseInt(year),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Portfolio update error:', error)
      return NextResponse.json({ error: '포트폴리오 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      project: data 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // 포트폴리오 프로젝트 소유권 확인
    const { data: project, error: projectError } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        image_url,
        contractor_id,
        contractors!inner(user_id)
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project || project.contractors.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 스토리지에서 이미지 삭제
    if (project.image_url) {
      try {
        const imagePath = project.image_url.split('/').slice(-2).join('/')
        await supabase.storage
          .from('portfolio-images')
          .remove([imagePath])
      } catch (storageError) {
        console.error('Storage deletion error:', storageError)
        // 스토리지 삭제 실패해도 DB 삭제는 진행
      }
    }

    // 포트폴리오 프로젝트 삭제
    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Portfolio deletion error:', error)
      return NextResponse.json({ error: '포트폴리오 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
