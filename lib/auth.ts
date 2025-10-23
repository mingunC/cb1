import { createBrowserClient } from '@/lib/supabase/clients';
import { createServerClient } from '@/lib/supabase/server-clients';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest, NextResponse } from 'next/server';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  userType?: 'customer' | 'contractor' | 'admin';
  contractorData?: any;
  error?: string;
  redirectTo?: string;
}

// 클라이언트 사이드 로그인
export async function signIn(credentials: AuthCredentials): Promise<AuthResult> {
  const supabase = createBrowserClient();
  
  try {
    // 1. Supabase 인증
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error) {
      console.error('Authentication error:', error);
      
      // 에러 메시지 한글화
      let errorMessage = '로그인에 실패했습니다.';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      
      return { success: false, error: errorMessage };
    }

    if (!data.user) {
      return { success: false, error: '로그인에 실패했습니다.' };
    }

    // 2. 사용자 타입 확인
    const userTypeResult = await getUserTypeAndData(data.user.id);
    
    if (!userTypeResult.success) {
      return { 
        success: false, 
        error: userTypeResult.error || '사용자 정보를 불러올 수 없습니다.' 
      };
    }

    // 3. 성공 응답
    return {
      success: true,
      user: data.user,
      userType: userTypeResult.userType,
      contractorData: userTypeResult.contractorData,
      redirectTo: getRedirectPath(userTypeResult.userType, userTypeResult.contractorData)
    };

  } catch (error: any) {
    console.error('Unexpected error during login:', error);
    return { 
      success: false, 
      error: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    };
  }
}

// 서버 사이드 로그인 (API 라우트용)
export async function signInServer(credentials: AuthCredentials): Promise<AuthResult> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error || !data.user) {
      return { success: false, error: 'Authentication failed' };
    }

    const userTypeResult = await getUserTypeAndDataServer(data.user.id);
    
    return {
      success: true,
      user: data.user,
      userType: userTypeResult.userType,
      contractorData: userTypeResult.contractorData,
      redirectTo: getRedirectPath(userTypeResult.userType, userTypeResult.contractorData)
    };

  } catch (error: any) {
    console.error('Server login error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ✅ 최적화: 사용자 타입과 관련 데이터 조회 (클라이언트)
async function getUserTypeAndData(userId: string): Promise<{
  success: boolean;
  userType?: 'customer' | 'contractor' | 'admin';
  contractorData?: any;
  error?: string;
}> {
  const supabase = createBrowserClient();

  try {
    // ✅ 최적화: 필요한 필드만 조회 + status 체크를 쿼리에서 처리
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('id, company_name, status')
      .eq('user_id', userId)
      .eq('status', 'active') // ✅ 쿼리 레벨에서 필터링
      .maybeSingle();

    // 에러가 발생하지 않고 데이터가 있으면 contractor
    if (contractorData) {
      return {
        success: true,
        userType: 'contractor',
        contractorData
      };
    }

    // contractors 테이블 조회 실패 시에만 에러 처리
    if (contractorError && contractorError.code !== 'PGRST116') { // PGRST116은 "no rows found" 에러
      console.error('Contractor data query error:', contractorError);
      return { success: false, error: '업체 정보 조회 실패' };
    }

    // ✅ 최적화: users 테이블에서 user_type만 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('User type query error:', userError);
      return { success: false, error: '사용자 정보 조회 실패' };
    }

    // users 테이블에 있으면 해당 타입 리턴
    if (userData && userData.user_type !== 'contractor') {
      return {
        success: true,
        userType: userData.user_type as 'customer' | 'admin'
      };
    }

    // 어느 테이블에도 없으면 기본 customer
    return {
      success: true,
      userType: 'customer'
    };

  } catch (error: any) {
    console.error('getUserTypeAndData error:', error);
    return { success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
}

// 서버 사이드 사용자 타입 조회
async function getUserTypeAndDataServer(userId: string): Promise<{
  success: boolean;
  userType?: 'customer' | 'contractor' | 'admin';
  contractorData?: any;
}> {
  const supabase = createServerClient();

  try {
    // ✅ 최적화: 필요한 필드만 조회 + status 필터
    const { data: contractorData } = await supabase
      .from('contractors')
      .select('id, company_name, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (contractorData) {
      return {
        success: true,
        userType: 'contractor',
        contractorData
      };
    }

    // ✅ 최적화: user_type만 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle();

    if (userData && userData.user_type !== 'contractor') {
      return {
        success: true,
        userType: userData.user_type as 'customer' | 'admin'
      };
    }

    return {
      success: true,
      userType: 'customer'
    };

  } catch (error) {
    console.error('Server getUserTypeAndData error:', error);
    return { success: false };
  }
}

// 사용자 타입에 따른 리다이렉트 경로 결정
function getRedirectPath(userType?: string, contractorData?: any): string {
  switch (userType) {
    case 'admin':
      return '/admin';
    case 'contractor':
      return '/contractor';
    case 'customer':
    default:
      return '/';
  }
}

// ✅ 최적화: 현재 사용자 정보 조회 (클라이언트)
export async function getCurrentUser(): Promise<{
  user: any | null;
  userType?: 'customer' | 'contractor' | 'admin';
  contractorData?: any;
}> {
  const supabase = createBrowserClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null };
    }

    const userTypeResult = await getUserTypeAndData(user.id);
    
    if (!userTypeResult.success) {
      return { user };
    }

    return {
      user,
      userType: userTypeResult.userType,
      contractorData: userTypeResult.contractorData
    };

  } catch (error) {
    console.error('getCurrentUser error:', error);
    return { user: null };
  }
}

// 로그아웃
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();

  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Unexpected sign out error:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
}

// 미들웨어용 사용자 정보 조회
export async function getUserForMiddleware(
  req: NextRequest, 
  res: NextResponse
): Promise<{
  session: any | null;
  userType?: 'customer' | 'contractor' | 'admin';
  isContractor: boolean;
  isAdmin: boolean;
}> {
  try {
    const supabase = createMiddlewareClient({ req, res });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { session: null, isContractor: false, isAdmin: false };
    }

    // 사용자 타입 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    const userType = userData?.user_type || 'customer';

    // 업체인 경우 추가 확인
    let isContractor = userType === 'contractor';
    if (userType === 'contractor' || !userData) {
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('id, status')
        .eq('user_id', session.user.id)
        .single();

      isContractor = !!(contractorData && contractorData.status === 'active');
    }

    return {
      session,
      userType,
      isContractor,
      isAdmin: userType === 'admin'
    };

  } catch (error) {
    console.error('getUserForMiddleware error:', error);
    return { session: null, isContractor: false, isAdmin: false };
  }
}

// 경로별 권한 확인
export function checkPathPermission(
  pathname: string,
  userType?: string,
  isContractor: boolean = false,
  isAdmin: boolean = false
): {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
} {
  // 인증 관련 공개 경로 (로그인/회원가입)
  const authPaths = ['/login', '/signup', '/contractor-login', '/contractor-signup', '/forgot-password'];
  if (authPaths.includes(pathname)) {
    return { allowed: true };
  }

  // 일반 공개 경로
  const publicPaths = ['/', '/pros', '/portfolio', '/events', '/quote-request'];
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return { allowed: true };
  }

  // 인증이 필요한 경로들
  const needsAuth = !userType && (
    pathname.startsWith('/admin') ||
    pathname === '/contractor' || // 정확히 /contractor 경로만
    pathname.startsWith('/contractor/') || // /contractor/ 로 시작하는 하위 경로들
    pathname.startsWith('/my-quotes') ||
    pathname.startsWith('/approved-projects') ||
    pathname.startsWith('/compare-quotes')
  );

  if (needsAuth) {
    return { 
      allowed: false, 
      redirectTo: '/login',
      reason: 'Authentication required'
    };
  }

  // 관리자 전용 경로
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return { 
        allowed: false, 
        redirectTo: '/',
        reason: 'Admin access required'
      };
    }
  }

  // 업체 전용 경로 (/contractor 로 시작하지만 로그인 페이지는 제외)
  if ((pathname === '/contractor' || pathname.startsWith('/contractor/')) && 
      !pathname.includes('login') && 
      !pathname.includes('signup')) {
    if (!isContractor) {
      return { 
        allowed: false, 
        redirectTo: '/contractor-signup',
        reason: 'Contractor access required'
      };
    }
  }

  return { allowed: true };
}
