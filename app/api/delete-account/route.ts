import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🗑️ Delete account API called')
  
  try {
    const supabase = await createServerClient()
    console.log('✅ Supabase client created')
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // 사용자의 provider 확인
    const provider = user.app_metadata?.provider || user.user_metadata?.provider
    const isOAuthUser = provider === 'google' || provider === 'oauth'
    
    console.log('🔐 Provider check:', { provider, isOAuthUser })

    const requestBody = await request.json()
    console.log('📦 Request body:', { 
      hasEmail: !!requestBody.email, 
      hasPassword: !!requestBody.password 
    })

    // OAuth 사용자와 일반 사용자 분기 처리
    if (isOAuthUser) {
      const { email: confirmEmail } = requestBody

      if (!confirmEmail) {
        return NextResponse.json(
          { error: 'Email is required for account deletion' },
          { status: 400 }
        )
      }

      console.log('📧 Email comparison:', { 
        confirmEmail, 
        userEmail: user.email,
        match: confirmEmail === user.email 
      })

      if (confirmEmail !== user.email) {
        return NextResponse.json(
          { error: 'Email does not match' },
          { status: 401 }
        )
      }
    } else {
      // 일반 이메일 사용자: 비밀번호 확인
      const { password } = requestBody

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
        console.error('❌ Password verification failed:', signInError)
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // 사용자 타입 확인
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    console.log('👤 User data:', { userData, userDataError: userDataError?.message })

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

    // Soft delete 실행
    console.log('🗑️ Executing soft delete for user:', user.id)
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete account', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ User marked as deleted')

    // contractors 업데이트
    if (userData?.user_type === 'contractor') {
      const { error: contractorError } = await supabase
        .from('contractors')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      console.log('📝 Contractor update:', { error: contractorError?.message })
    }

    // Auth 계정 삭제 (선택사항 - 주석 처리)
    // Supabase Auth에서 완전 삭제하려면 서비스 역할 키가 필요합니다
    // 현재는 soft delete만 수행하고, Auth 계정은 유지합니다
    // 필요시 Supabase Dashboard에서 수동으로 삭제할 수 있습니다

    await supabase.auth.signOut()
    console.log('✅ Signed out')

    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted' 
    })

  } catch (error: any) {
    console.error('❌ Delete account error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
