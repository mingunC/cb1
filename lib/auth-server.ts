import { createServerClient } from '@/lib/supabase/server-clients';
import type { AuthCredentials, AuthResult } from './auth';

// 서버 사이드 로그인 (API 라우트용)
export async function signInServer(credentials: AuthCredentials): Promise<AuthResult> {
  const supabase = await createServerClient();
  
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

// 서버 사이드 사용자 타입 조회
async function getUserTypeAndDataServer(userId: string): Promise<{
  success: boolean;
  userType?: 'customer' | 'contractor' | 'admin';
  contractorData?: any;
}> {
  const supabase = await createServerClient();

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

