import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🗑️ Delete account API called')
  
  try {
    // 요청 바디 파싱 (먼저 파싱해서 accessToken 확인)
    const body = await request.json()
    const { password, email: confirmEmail, accessToken } = body
    
    console.log('📝 Request body:', { 
      hasPassword: !!password, 
      hasConfirmEmail: !!confirmEmail, 
      hasAccessToken: !!accessToken 
    })
    
    let user = null
    let supabase = null

    // ✅ 방법 1: accessToken이 직접 전달된 경우
    if (accessToken) {
      console.log('🔐 Using provided accessToken')
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        }
      )
      
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
      if (userData?.user) {
        user = userData.user
        console.log('✅ Got user from accessToken:', user.email)
      } else {
        console.error('❌ accessToken getUser failed:', userError)
      }
    }

    // ✅ 방법 2: Authorization 헤더에서 토큰 추출
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log('🔐 Using Authorization header')
        
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        )
        
        const { data: userData } = await supabase.auth.getUser(token)
        if (userData?.user) {
          user = userData.user
          console.log('✅ Got user from auth header:', user.email)
        }
      }
    }

    // ✅ 방법 3: 쿠키에서 세션 확인 (기존 방식)
    if (!user) {
      console.log('🔐 Trying cookie-based auth')
      const cookieStore = await cookies()
      
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // Server Component에서 쿠키 설정 불가 시 무시
              }
            },
          },
        }
      )

      const { data: sessionData } = await supabase.auth.getSession()
      console.log('🔐 Session check:', { hasSession: !!sessionData?.session })
      
      if (sessionData?.session?.user) {
        user = sessionData.session.user
        console.log('✅ Got user from session:', user.email)
      } else {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          user = userData.user
          console.log('✅ Got user from getUser:', user.email)
        }
      }
    }

    if (!user || !supabase) {
      console.error('❌ No user found - all auth methods failed')
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Auth session missing! Please log in again.' },
        { status: 401 }
      )
    }

    // OAuth vs 일반 사용자 구분 (더 넓은 범위로 체크)
    const provider = user.app_metadata?.provider || ''
    const identities = user.identities || []
    
    // OAuth 사용자 확인: provider가 있거나, identities에 oauth가 있는 경우
    const isOAuthUser = 
      provider === 'google' || 
      provider === 'kakao' || 
      provider === 'oauth' ||
      provider.includes('google') ||
      provider.includes('oauth') ||
      identities.some((id: any) => id.provider === 'google' || id.provider === 'kakao')
    
    console.log('👤 User info:', {
      email: user.email,
      provider,
      isOAuthUser,
      identitiesCount: identities.length,
      identityProviders: identities.map((id: any) => id.provider)
    })

    if (isOAuthUser) {
      // OAuth 사용자: 이메일로 확인 (대소문자 무시)
      const userEmail = user.email?.toLowerCase().trim()
      const inputEmail = confirmEmail?.toLowerCase().trim()
      
      console.log('📧 Email comparison:', { userEmail, inputEmail, match: userEmail === inputEmail })
      
      if (!inputEmail || inputEmail !== userEmail) {
        return NextResponse.json(
          { error: 'Email does not match', details: 'Please enter the email address you used to sign up.' },
          { status: 401 }
        )
      }
    } else {
      // 일반 사용자: 비밀번호로 확인
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        )
      }

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

    // contractors 테이블 업데이트 (먼저 시도)
    const { error: contractorError } = await supabase
      .from('contractors')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (contractorError) {
      console.error('❌ Failed to update contractor:', contractorError)
      // contractors 업데이트 실패해도 계속 진행
    } else {
      console.log('✅ Contractor status updated to inactive')
    }

    // users 테이블 Soft delete 처리 (선택적)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.warn('⚠️ Failed to mark user as deleted in users table:', updateError.message)
        // users 테이블 업데이트 실패해도 계속 진행 (테이블이 없거나 권한 문제일 수 있음)
      } else {
        console.log('✅ User marked as deleted in users table')
      }
    } catch (userTableError) {
      console.warn('⚠️ users table update skipped:', userTableError)
    }

    // 로그아웃
    await supabase.auth.signOut()

    console.log('✅ Account deleted successfully:', user.email)
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
