import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('=== CREATE CONTRACTOR API ===')
  
  try {
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    console.log('Auth header exists:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token in Authorization header')
      return NextResponse.json({ error: '인증되지 않았습니다. (토큰 없음)' }, { status: 401 })
    }
    
    const accessToken = authHeader.replace('Bearer ', '')
    console.log('Access token extracted, length:', accessToken.length)
    
    // 환경변수 확인
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Service role key missing')
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    
    // Supabase Admin 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    
    // 사용자 검증
    console.log('Verifying user with token...')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.log('User verification failed:', userError?.message)
      return NextResponse.json({ error: '인증되지 않았습니다. (사용자 검증 실패)' }, { status: 401 })
    }
    
    console.log('User verified:', user.email)
    
    // 관리자 확인
    if (user.email !== 'cmgg919@gmail.com') {
      console.log('Not admin:', user.email)
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    
    console.log('Admin verified, parsing body...')
    const body = await request.json()
    const { email, password, company_name, contact_name, phone, address } = body
    
    if (!email || !password || !company_name) {
      return NextResponse.json({ error: '이메일, 비밀번호, 업체명은 필수입니다.' }, { status: 400 })
    }
    
    // 이메일 중복 확인
    console.log('Checking existing user...')
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUsers?.users?.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 })
    }
    
    // 사용자 생성
    console.log('Creating user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: company_name, user_type: 'contractor' }
    })
    
    if (createError || !newUser.user) {
      console.log('User creation failed:', createError?.message)
      return NextResponse.json({ error: `사용자 생성 실패: ${createError?.message}` }, { status: 500 })
    }
    
    console.log('User created:', newUser.user.id)
    
    // users 테이블 - display_name 대신 name 사용 또는 최소 필드만
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: newUser.user.id, 
        email, 
        user_type: 'contractor'
      })
    
    if (userInsertError) {
      console.log('Users table insert failed:', userInsertError.message)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: `사용자 테이블 추가 실패: ${userInsertError.message}` }, { status: 500 })
    }
    
    // contractors 테이블
    console.log('Creating contractor...')
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .insert({
        user_id: newUser.user.id,
        company_name,
        contact_name: contact_name || null,
        email,
        phone: phone || null,
        address: address || null,
        specialties: [],
        years_experience: 0,
        portfolio_count: 0,
        rating: 0,
        status: 'active'
      })
      .select()
      .single()
    
    if (contractorError) {
      console.log('Contractor insert failed:', contractorError.message)
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: `업체 추가 실패: ${contractorError.message}` }, { status: 500 })
    }
    
    console.log('SUCCESS! Contractor created:', contractor.id)
    return NextResponse.json({ success: true, contractor, message: '업체가 성공적으로 추가되었습니다.' })
    
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 })
  }
}
