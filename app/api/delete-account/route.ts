import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    // 비밀번호 확인 (보안을 위해)
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required for account deletion' },
        { status: 400 }
      )
    }

    // 비밀번호 재확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // 진행 중인 프로젝트 확인 (고객인 경우)
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (userData?.user_type === 'customer') {
      const { data: activeProjects } = await supabase
        .from('quote_requests')
        .select('id, status')
        .eq('customer_id', user.id)
        .in('status', ['approved', 'site-visit-pending', 'bidding', 'bidding-closed', 'contractor-selected', 'in-progress'])

      if (activeProjects && activeProjects.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with active projects. Please complete or cancel all projects first.' },
          { status: 400 }
        )
      }
    }

    // 진행 중인 입찰 확인 (업체인 경우)
    if (userData?.user_type === 'contractor') {
      const { data: activeQuotes } = await supabase
        .from('contractor_quotes')
        .select('id, status')
        .eq('contractor_id', user.id)
        .eq('status', 'pending')

      if (activeQuotes && activeQuotes.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with pending quotes. Please withdraw all pending quotes first.' },
          { status: 400 }
        )
      }
    }

    // Soft delete: users 테이블에 is_deleted 플래그 추가
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to mark user as deleted:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    // contractors 또는 customers 테이블도 업데이트
    if (userData?.user_type === 'contractor') {
      await supabase
        .from('contractors')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    }

    // Auth 계정 삭제 (선택사항 - 주석 처리)
    // Supabase Auth에서 완전 삭제하려면 서비스 역할 키가 필요합니다
    // 현재는 soft delete만 수행하고, Auth 계정은 유지합니다
    // 필요시 Supabase Dashboard에서 수동으로 삭제할 수 있습니다

    // 로그아웃
    await supabase.auth.signOut()

    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted' 
    })

  } catch (error: any) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
