import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server-clients'

export async function POST(request: NextRequest) {
  console.log('=== Contractor Create API Started ===')
  
  try {
    console.log('Step 1: Creating server client...')
    const supabase = await createServerClient()
    
    console.log('Step 2: Getting user from auth...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Step 3: Auth result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.log('Auth failed:', authError?.message || 'No user found')
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 })
    }

    console.log('Step 4: Checking admin permission...')
    if (user.email !== 'cmgg919@gmail.com') {
      console.log('Not admin:', user.email)
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    console.log('Step 5: Parsing request body...')
    const body = await request.json()
    const {
      email,
      password,
      company_name,
      contact_name,
      phone,
      address,
      license_number,
      insurance_info,
      specialties,
      years_experience
    } = body

    console.log('Step 6: Request body received:', { email, company_name, contact_name })

    // 필수 필드 검증
    if (!email || !password || !company_name) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: '이메일, 비밀번호, 업체명은 필수입니다.' },
        { status: 400 }
      )
    }

    console.log('Step 7: Creating admin client...')
    const supabaseAdmin = createAdminClient()
    console.log('Admin client created:', !!supabaseAdmin)

    // 이메일 중복 확인
    console.log('Step 8: Checking for existing user...')
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.log('List users error:', listError.message)
      return NextResponse.json(
        { error: `사용자 목록 조회 실패: ${listError.message}` },
        { status: 500 }
      )
    }
    
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email)

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    console.log('Step 9: Creating new auth user...')
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: company_name,
        user_type: 'contractor'
      }
    })

    if (createUserError || !newUser.user) {
      console.log('User creation error:', createUserError?.message)
      return NextResponse.json(
        { error: `사용자 생성 실패: ${createUserError?.message}` },
        { status: 500 }
      )
    }

    console.log('Step 10: User created successfully:', newUser.user.id)

    // users 테이블에 추가
    console.log('Step 11: Inserting into users table...')
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        user_type: 'contractor',
        display_name: company_name
      })

    if (userInsertError) {
      console.log('Users table insert error:', userInsertError.message)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `사용자 테이블 추가 실패: ${userInsertError.message}` },
        { status: 500 }
      )
    }

    console.log('Step 12: Users table insert successful')

    // contractors 테이블에 추가
    console.log('Step 13: Inserting into contractors table...')
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .insert({
        user_id: newUser.user.id,
        company_name,
        contact_name: contact_name || null,
        email,
        phone: phone || null,
        address: address || null,
        license_number: license_number || null,
        insurance_info: insurance_info || null,
        specialties: specialties || [],
        years_experience: years_experience || 0,
        portfolio_count: 0,
        rating: 0,
        status: 'active'
      })
      .select()
      .single()

    if (contractorError) {
      console.log('Contractor insert error:', contractorError.message)
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `업체 정보 추가 실패: ${contractorError.message}` },
        { status: 500 }
      )
    }

    console.log('Step 14: Contractor created successfully:', contractor.id)
    console.log('=== Contractor Create API Completed ===')

    return NextResponse.json({
      success: true,
      contractor,
      message: '업체가 성공적으로 추가되었습니다.'
    })

  } catch (error) {
    console.error('Contractor creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '업체 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
