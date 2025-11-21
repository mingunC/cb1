import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-clients';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // 1. 테이블 존재 여부 확인
    const tableChecks = {
      contractors: false,
      pros: false,
      auth_users_role: false
    };
    
    try {
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('contractors')
        .select('id')
        .limit(1);
      tableChecks.contractors = !contractorsError;
    } catch (e) {}
    
    try {
      const { data: prosData, error: prosError } = await supabase
        .from('pros')
        .select('id')
        .limit(1);
      tableChecks.pros = !prosError;
    } catch (e) {}
    
    try {
      const { data: authData, error: authError } = await supabase
        .from('users')
        .select('id, user_type')
        .limit(1);
      tableChecks.auth_users_role = !authError;
    } catch (e) {}
    
    // 2. 업체 계정 샘플 데이터 확인
    let contractorAccounts = [];
    let prosAccounts = [];
    
    if (tableChecks.contractors) {
      const { data } = await supabase
        .from('contractors')
        .select('id, user_id, company_name, email, status')
        .limit(5);
      contractorAccounts = data || [];
    }
    
    if (tableChecks.pros) {
      const { data } = await supabase
        .from('pros')
        .select('id, user_id, business_name, email, is_active')
        .limit(5);
      prosAccounts = data || [];
    }
    
    // 3. auth.users에서 contractor 역할 확인
    let authContractors = [];
    try {
      const { data } = await supabase.rpc('check_contractor_users');
      authContractors = data || [];
    } catch (e) {
      // RPC 함수가 없으면 무시
    }
    
    return NextResponse.json({
      success: true,
      diagnosis: {
        tables: tableChecks,
        counts: {
          contractors: contractorAccounts.length,
          pros: prosAccounts.length,
          auth_contractors: authContractors.length
        },
        samples: {
          contractors: contractorAccounts,
          pros: prosAccounts,
          auth_contractors: authContractors
        }
      },
      recommendations: [
        tableChecks.contractors ? "✅ contractors 테이블 존재" : "❌ contractors 테이블 없음",
        tableChecks.pros ? "✅ pros 테이블 존재" : "❌ pros 테이블 없음",
        contractorAccounts.length > 0 ? `✅ ${contractorAccounts.length}개의 업체 계정 발견` : "❌ 업체 계정 없음",
        prosAccounts.length > 0 ? `✅ ${prosAccounts.length}개의 pros 계정 발견` : "❌ pros 계정 없음"
      ]
    });
    
  } catch (error: any) {
    console.error('Debug contractor error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnosis: null
    }, { status: 500 });
  }
}
