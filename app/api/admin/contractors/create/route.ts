import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 가장 먼저 로그 출력
  console.log('=== API REACHED ===')
  
  try {
    console.log('Step 1: Getting cookies from request headers')
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('Cookie exists:', !!cookieHeader)
    console.log('Cookie length:', cookieHeader.length)
    
    // 환경변수 확인
    console.log('Step 2: Checking env vars')
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    
    // 쿠키 파싱
    console.log('Step 3: Parsing cookies')
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) cookies[key] = value
    })
    
    console.log('Cookie keys:', Object.keys(cookies).join(', '))
    
    // Supabase auth 토큰 찾기
    const authTokenKey = Object.keys(cookies).find(key => 
      key.includes('sb-') && key.includes('-auth-token')
    )
    
    console.log('Step 4: Auth token key:', authTokenKey || 'NOT FOUND')
    
    if (!authTokenKey || !cookies[authTokenKey]) {
      console.log('No auth token found')
      return NextResponse.json({ error: '인증되지 않았습니다. (토큰 없음)' }, { status: 401 })
    }
    
    // 토큰 디코딩
    console.log('Step 5: Decoding token')
    let accessToken = ''
    try {
      const decoded = decodeURIComponent(cookies[authTokenKey])
      console.log('Decoded token length:', decoded.length)
      const tokenData = JSON.parse(decoded)
      accessToken = tokenData.access_token || (Array.isArray(tokenData) ? tokenData[0]?.access_token : '')
      console.log('Access token extracted:', !!accessToken)
    } catch (e: any) {
      console.log('Token decode error:', e.message)
      return NextResponse.json({ error: '토큰 파싱 실패' }, { status: 401 })
    }
    
    if (!accessToken) {
      return NextResponse.json({ error: '인증되지 않았습니다. (액세스 토큰 없음)' }, { status: 401 })
    }
    
    // Supabase Admin 클라이언트 생성
    console.log('Step 6: Creating Supabase admin client')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    
    // 사용자 검증
    console.log('Step 7: Verifying user')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.log('User verification failed:', userError?.message)
      return NextResponse.json({ error: '인증되지 않았습니다. (사용자 검증 실패)' }, { status: 401 })
    }
    
    console.log('Step 8: User verified:', user.email)
    
    // 관리자 확인
    if (user.email !== 'cmgg919@gmail.com') {
      console.log('Not admin')
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    
    console.log('Step 9: Admin verified, parsing body')
    const body = await request.json()
    const { email, password, company_name, contact_name, phone, address } = body
    
    if (!email || !password || !company_name) {
      return NextResponse.json({ error: '이메일, 비밀번호, 업체명은 필수입니다.' }, { status: 400 })
    }
    
    // 이메일 중복 확인
    console.log('Step 10: Checking existing user')
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUsers?.users?.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 })
    }
    
    // 사용자 생성
    console.log('Step 11: Creating user')
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
    
    console.log('Step 12: User created:', newUser.user.id)
    
    // users 테이블
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({ id: newUser.user.id, email, user_type: 'contractor', display_name: company_name })
    
    if (userInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: `사용자 테이블 추가 실패: ${userInsertError.message}` }, { status: 500 })
    }
    
    // contractors 테이블
    console.log('Step 13: Creating contractor')
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
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: `업체 추가 실패: ${contractorError.message}` }, { status: 500 })
    }
    
    console.log('Step 14: SUCCESS!')
    return NextResponse.json({ success: true, contractor, message: '업체가 성공적으로 추가되었습니다.' })
    
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 })
  }
}
