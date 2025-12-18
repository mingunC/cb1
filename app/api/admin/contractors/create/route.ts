import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server-clients'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 })
    }

    // 관리자 확인
    if (user.email !== 'cmgg919@gmail.com') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

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

    // 필수 필드 검증
    if (!email || !password || !company_name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 업체명은 필수입니다.' },
        { status: 400 }
      )
    }

    // Service Role 클라이언트 사용 (admin 작업용)
    const supabaseAdmin = createAdminClient()

    // 이메일 중복 확인
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email)

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    // Service role client로 사용자 생성 (이메일 확인 없이)
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 자동 처리
      user_metadata: {
        name: company_name,
        user_type: 'contractor'
      }
    })

    if (createUserError || !newUser.user) {
      console.error('User creation error:', createUserError)
      return NextResponse.json(
        { error: `사용자 생성 실패: ${createUserError?.message}` },
        { status: 500 }
      )
    }

    // users 테이블에 추가 (admin 클라이언트로 RLS 우회)
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        user_type: 'contractor',
        display_name: company_name
      })

    if (userInsertError) {
      console.error('Users table insert error:', userInsertError)
      // 생성된 auth 사용자 삭제
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `사용자 테이블 추가 실패: ${userInsertError.message}` },
        { status: 500 }
      )
    }

    // contractors 테이블에 추가 (admin 클라이언트로 RLS 우회)
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
        status: 'active' // 관리자가 직접 추가하므로 바로 활성화
      })
      .select()
      .single()

    if (contractorError) {
      console.error('Contractor insert error:', contractorError)
      // 생성된 데이터 롤백
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: `업체 정보 추가 실패: ${contractorError.message}` },
        { status: 500 }
      )
    }

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
