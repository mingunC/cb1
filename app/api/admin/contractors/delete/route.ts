import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
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
    const { contractor_id, user_id } = body

    if (!contractor_id || !user_id) {
      return NextResponse.json(
        { error: 'contractor_id와 user_id가 필요합니다.' },
        { status: 400 }
      )
    }

    // 업체 정보 확인
    const { data: contractor, error: contractorError } = await supabase
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
    const { error: deleteContractorError } = await supabase
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
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', user_id)

    if (deleteUserError) {
      console.error('Users delete error:', deleteUserError)
      // 부분적으로만 삭제된 상태이지만 계속 진행
    }

    // 3. auth.users에서 삭제 (admin API 사용)
    const supabaseAdmin = await createServerClient()
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteAuthError) {
      console.error('Auth user delete error:', deleteAuthError)
      // 로그만 남기고 계속 진행
    }

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
