import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const { user_id, company_name, contact_name, phone, email, address, specialties, status } = body

    // 사용자 ID가 현재 로그인한 사용자와 일치하는지 확인
    if (user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // contractors 테이블에 데이터 삽입
    const { data, error } = await supabase
      .from('contractors')
      .insert({
        user_id,
        company_name,
        contact_name,
        phone,
        email,
        address,
        specialties: specialties || [],
        status: status || 'active',
        years_experience: 0,
        portfolio_count: 0,
        rating: 0.0
      })
      .select()
      .single()

    if (error) {
      console.error('Contractor creation error:', error)
      return NextResponse.json({ error: '업체 프로필 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contractor: data 
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

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
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 사용자의 업체 정보 조회
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Contractor fetch error:', error)
      return NextResponse.json({ error: '업체 정보 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ contractor: data })

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
    const { company_name, contact_name, phone, email, address, specialties, years_experience, bio, website } = body

    // 사용자의 업체 정보 업데이트
    const { data, error } = await supabase
      .from('contractors')
      .update({
        company_name,
        contact_name,
        phone,
        email,
        address,
        specialties,
        years_experience,
        bio,
        website,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Contractor update error:', error)
      return NextResponse.json({ error: '업체 정보 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      contractor: data 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
