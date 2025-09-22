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
  userData?: any;
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

    // 2. 사용자 타입 확인 (개선된 로직)
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
      userData: userTypeResult.userData,
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

// 사용자 타입과 관련 데이터 조회 (개선된 버전)
async function getUserTypeAndData(userId: string): Promise<{
  success: boolean;
  userType?: 'customer' | 'contractor' | 'admin';
  userData?: any;
  contractorData?: any;
  error?: string;
}> {
  const supabase = createBrowserClient();

  try {
    // 1. 먼저 contractors 테이블 확인 (업체 우선)
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('id, company_name, contact_name, phone, address, status')
      .eq('user_id', userId)
      .maybeSingle();

    // contractors 테이블에 있으면 업체로 처리
    if (contractorData && !contractorError) {
      console.log('User is a contractor:', contractorData.company_name);
      
      if (contractorData.status && contractorData.status !== 'active') {
        return { 
          success: false, 
          error: '업체 계정이 비활성화되어 있습니다. 관리자에게 문의해주세요.' 
        };
      }

      return {
        success: true,
        userType: 'contractor',
        contractorData,
        userData: null
      };
    }

    // 2. contractors 테이블에 없으면 users 테이블 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userData && !userError) {
      console.log('User type from users table:', userData.user_type);
      
      return {
        success: true,
        userType: userData.user_type || 'customer',
        userData,
        contractorData: null
      };
    }

    // 3. 둘 다 없으면 기본값 (customer)
    console.log('User not found in either table, defaulting to customer');
    return {
      success: true,
      userType: 'customer',
      userData: null,
      contractorData: null
    };

  } catch (error: any) {
    console.error('getUserTypeAndData error:', error);
    return { success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
}

// 현재 사용자 정보 조회 (개선된 버전)
export async function getCurrentUser(): Promise<{
  success: boolean;
  user: any | null;
  userType?: 'customer' | 'contractor' | 'admin';
  userData?: any;
  contractorData?: any;
}> {
  const supabase = createBrowserClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { success: false, user: null };
    }

    const userTypeResult = await getUserTypeAndData(user.id);
    
    return {
      success: userTypeResult.success,
      user,
      userType: userTypeResult.userType,
      userData: userTypeResult.userData,
      contractorData: userTypeResult.contractorData
    };

  } catch (error) {
    console.error('getCurrentUser error:', error);
    return { success: false, user: null };
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
      userData: userTypeResult.userData,
      contractorData: userTypeResult.contractorData,
      redirectTo: getRedirectPath(userTypeResult.userType, userTypeResult.contractorData)
    };

  } catch (error: any) {
    console.error('Server login error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// 서버 사이드 사용자 타입 조회 (개선된 버전)
async function getUserTypeAndDataServer(userId: string): Promise<{
  success: boolean;
  userType?: 'customer' | 'contractor' | 'admin';
  userData?: any;
  contractorData?: any;
}> {
  const supabase = createServerClient();

  try {
    // 1. 먼저 contractors 테이블 확인
    const { data: contractorData } = await supabase
      .from('contractors')
      .select('id, company_name, contact_name, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (contractorData) {
      return {
        success: true,
        userType: 'contractor',
        contractorData,
        userData: null
      };
    }

    // 2. users 테이블 확인
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userData) {
      return {
        success: true,
        userType: userData.user_type || 'customer',
        userData,
        contractorData: null
      };
    }

    // 3. 기본값
    return {
      success: true,
      userType: 'customer',
      userData: null,
      contractorData: null
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

// 미들웨어용 사용자 정보 조회 (개선된 버전)
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
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('미들웨어 세션 오류:', sessionError);
      return { session: null, isContractor: false, isAdmin: false };
    }
    
    if (!session) {
      return { session: null, isContractor: false, isAdmin: false };
    }

    console.log('미들웨어 세션 확인됨:', session.user.email);

    // 1. contractors 테이블 먼저 확인
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractors')
      .select('id, status')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (contractorError) {
      console.error('미들웨어 contractor 조회 오류:', contractorError);
    }

    if (contractorData) {
      console.log('미들웨어 contractor 발견:', {
        id: contractorData.id,
        status: contractorData.status,
        isActive: contractorData.status === 'active'
      });
      
      return {
        session,
        userType: 'contractor',
        isContractor: contractorData.status === 'active',
        isAdmin: false
      };
    }

    // 2. users 테이블 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .maybeSingle();

    if (userError) {
      console.error('미들웨어 user 조회 오류:', userError);
    }

    const userType = userData?.user_type || 'customer';
    console.log('미들웨어 user 타입:', userType);

    return {
      session,
      userType: userType as 'customer' | 'admin',
      isContractor: false,
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
