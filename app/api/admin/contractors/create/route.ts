import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('=== CREATE CONTRACTOR API ===')
  
  try {
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증되지 않았습니다. (토큰 없음)' }, { status: 401 })
    }
    
    const accessToken = authHeader.replace('Bearer ', '')
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    
    // Supabase Admin 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    
    // 사용자 검증
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json({ error: '인증되지 않았습니다. (사용자 검증 실패)' }, { status: 401 })
    }
    
    // 관리자 확인
    if (user.email !== 'cmgg919@gmail.com') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    
    const body = await request.json()
    const { email, password, company_name, contact_name, phone, address, specialties, preferred_languages } = body
    
    if (!email || !password || !company_name) {
      return NextResponse.json({ error: '이메일, 비밀번호, 업체명은 필수입니다.' }, { status: 400 })
    }
    
    // 이메일 중복 확인
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUsers?.users?.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 })
    }
    
    // contact_name에서 first_name, last_name 분리
    const nameParts = (contact_name || company_name).split(' ')
    const firstName = nameParts[0] || company_name
    const lastName = nameParts.slice(1).join(' ') || ''
    
    // preferred_language 결정 (첫 번째 언어 사용)
    const langs = preferred_languages || ['en']
    const primaryLang = langs[0] || 'en'
    
    // 사용자 생성
    console.log('Creating auth user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        first_name: firstName,
        last_name: lastName,
        user_type: 'contractor',
        phone: phone || '',
        preferred_language: primaryLang,
        preferred_languages: langs
      }
    })
    
    if (createError || !newUser.user) {
      return NextResponse.json({ error: `사용자 생성 실패: ${createError?.message}` }, { status: 500 })
    }
    
    console.log('Auth user created:', newUser.user.id)
    
    // users 테이블
    console.log('Inserting into users table...')
    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: newUser.user.id, 
        email, 
        user_type: 'contractor',
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        preferred_language: primaryLang,
        preferred_languages: langs
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
        status: 'active',
        specialties: specialties || ['residential'],
        preferred_languages: langs,
        years_experience: 0,
        portfolio_count: 0,
        rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
