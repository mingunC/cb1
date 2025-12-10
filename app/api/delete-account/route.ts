import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🗑️ Delete account API called')
  
  try {
    const supabase = await createServerClient()
    console.log('✅ Supabase client created with cookies')
    
    // 사용자 확인 - getSession과 getUser 모두 시도
    let user = null
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session check:', { 
      hasSession: !!sessionData?.session, 
      userId: sessionData?.session?.user?.id,
      sessionError: sessionError?.message 
    })
    
    if (sessionData?.session?.user) {
      user = sessionData.session.user
      console.log('✅ Got user from session:', user.email)
    } else {
      // getSession이 실패하면 getUser로 시도
      const { data: userData, error: userError } = await supabase.auth.getUser()
      console.log('👤 User check:', { 
        hasUser: !!userData?.user, 
        userId: userData?.user?.id,
        userError: userError?.message 
      })
      
      if (userData?.user) {
        user = userData.user
        console.log('✅ Got user from getUser:', user.email)
      }
    }
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth session missing!' },
        { status: 401 }
      )
    }

    // Provider 확인
    const provider = user.app_metadata?.provider || user.user_metadata?.provider
    const isOAuthUser = provider === 'google' || provider === 'oauth'
    console.log('🔐 Provider:', provider, 'isOAuth:', isOAuthUser)

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
        match: confirmEmail.toLowerCase() === user.email?.toLowerCase() 
      })

      if (confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
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

    // 진행 중인 프로젝트/입찰 확인

    if (userData?.user_type === 'customer') {
      const { data: activeProjects } = await supabase
        .from('quote_requests')
        .select('id, status')
        .eq('customer_id', user.id)
        .in('status', ['approved', 'site-visit-pending', 'bidding', 'bidding-closed', 'contractor-selected', 'in-progress'])

      if (activeProjects && activeProjects.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with active projects.' },
          { status: 400 }
        )
      }
    }

    if (userData?.user_type === 'contractor') {
      const { data: activeQuotes } = await supabase
        .from('contractor_quotes')
        .select('id, status')
        .eq('contractor_id', user.id)
        .eq('status', 'pending')

      if (activeQuotes && activeQuotes.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with pending quotes.' },
          { status: 400 }
        )
      }
    }

    // Soft delete 실행
    console.log('🗑️ Soft deleting user:', user.id)
    
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

    // Contractor 비활성화
    if (userData?.user_type === 'contractor') {
      const { error: contractorError } = await supabase
        .from('contractors')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (contractorError) {
        console.error('⚠️ Contractor update error:', contractorError)
      }
    }

    // 로그아웃
    await supabase.auth.signOut()
    console.log('✅ Account deleted successfully')

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
