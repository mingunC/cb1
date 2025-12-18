import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  console.log('=== DELETE CONTRACTOR API ===')
  
  try {
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증되지 않았습니다. (토큰 없음)' }, { status: 401 })
    }
    
    const accessToken = authHeader.replace('Bearer ', '')
    
    // 환경변수 확인
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
    const { contractor_id, user_id } = body

    if (!contractor_id || !user_id) {
      return NextResponse.json(
        { error: 'contractor_id와 user_id가 필요합니다.' },
        { status: 400 }
      )
    }

    // 업체 정보 확인
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from('contractors')
      .select('company_name, email')
      .eq('id', contractor_id)
      .eq('user_id', user_id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: '업체를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 1. contractors 테이블에서 삭제
    const { error: deleteContractorError } = await supabaseAdmin
      .from('contractors')
      .delete()
      .eq('id', contractor_id)

    if (deleteContractorError) {
      console.error('Contractor delete error:', deleteContractorError)
      return NextResponse.json(
        { error: `업체 삭제 실패: ${deleteContractorError.message}` },
        { status: 500 }
      )
    }

    // 2. users 테이블에서 삭제
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id)

    if (deleteUserError) {
      console.error('Users delete error:', deleteUserError)
    }

    // 3. auth.users에서 삭제
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteAuthError) {
      console.error('Auth user delete error:', deleteAuthError)
    }

    console.log('SUCCESS! Contractor deleted:', contractor_id)
    return NextResponse.json({
      success: true,
      message: `업체 "${contractor.company_name}"가 성공적으로 삭제되었습니다.`,
      deleted_contractor: {
        id: contractor_id,
        company_name: contractor.company_name,
        email: contractor.email
      }
    })

  } catch (error) {
    console.error('Contractor deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '업체 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
