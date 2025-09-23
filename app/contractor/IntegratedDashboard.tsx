// IntegratedDashboard.tsx 수정 - users 테이블의 실제 구조에 맞게

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (실제 import 경로에 맞게 조정)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  companyName?: string;
}

interface QuoteRequest {
  id: string;
  customer_id: string;
  space_type: string;
  project_types: string[];
  budget: string;
  timeline: string;
  postal_code: string;
  full_address: string;
  description?: string;
  status?: string;
  created_at: string;
  selected_contractor_id?: string | null;
  // 분류 및 내 견적 정보
  category: 'open' | 'quoted' | 'selected' | 'completed-mine' | 'completed-lost' | 'completed-other';
  myQuote?: {
    id: string;
    estimated_cost: number;
    status: string;
    quote_details?: string;
  } | null;
  isEditable: boolean;
  isReadOnly?: boolean;
}

export default function IntegratedDashboard({ contractorId }: { contractorId: string }) {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [customerInfoMap, setCustomerInfoMap] = useState<Record<string, CustomerInfo>>({});
  const [loading, setLoading] = useState(true);

  console.log('🎯 IntegratedDashboard props:', { contractorId });

  useEffect(() => {
    if (contractorId) {
      fetchQuoteRequests();
    }
  }, [contractorId]);

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 견적 요청 조회 시작:', contractorId);
      
      // 단계별 테스트: 가장 간단한 조회부터 시작
      
      // 1. 모든 quote_requests 조회 (기본 테스트)
      console.log('1️⃣ 기본 quote_requests 조회 시도...');
      const { data: allQuoteRequests, error: allError } = await supabase
        .from('quote_requests')
        .select('*')
        .limit(10);
      
      console.log('1️⃣ 기본 조회 결과:', { 
        count: allQuoteRequests?.length || 0, 
        error: allError?.message,
        sample: allQuoteRequests?.[0] 
      });
      
      // 2. contractor_quotes 테이블 존재 여부 확인
      console.log('2️⃣ contractor_quotes 테이블 조회 시도...');
      const { data: myQuotes, error: quotesError } = await supabase
              .from('contractor_quotes')
              .select('*')
        .eq('contractor_id', contractorId)
        .limit(5);
      
      console.log('2️⃣ contractor_quotes 조회 결과:', { 
        count: myQuotes?.length || 0, 
        error: quotesError?.message,
        sample: myQuotes?.[0] 
      });

      // 3. 기본적인 필터링된 quote_requests 조회
      console.log('3️⃣ 필터링된 quote_requests 조회 시도...');
      const { data: openRequests, error: openError } = await supabase
        .from('quote_requests')
        .select('*')
        .in('status', ['open', 'pending', 'approved', 'bidding'])
        .limit(10);
      
      console.log('3️⃣ 필터링된 조회 결과:', { 
        count: openRequests?.length || 0, 
        error: openError?.message 
      });

      // 임시로 단순한 데이터 구조 사용 (성공한 기본 조회만)
      let simpleRequests: QuoteRequest[] = [];
      
      if (!allError && allQuoteRequests) {
        simpleRequests = allQuoteRequests.map(req => {
          // 완료된 프로젝트는 읽기 전용으로 설정
          const isCompleted = req.status === 'completed' || req.status === 'closed';
          return {
            ...req,
            category: isCompleted ? 'completed-other' as const : 'open' as const,
            myQuote: null,
            isEditable: !isCompleted,
            isReadOnly: isCompleted
          };
        });
      }
      
      if (!openError && openRequests) {
        // 중복 제거하면서 필터링된 요청 추가
        const existingIds = new Set(simpleRequests.map(r => r.id));
        const newRequests = openRequests
          .filter(req => !existingIds.has(req.id))
          .map(req => {
            const isCompleted = req.status === 'completed' || req.status === 'closed';
            return {
              ...req,
              category: isCompleted ? 'completed-other' as const : 'open' as const,
              myQuote: null,
              isEditable: !isCompleted,
              isReadOnly: isCompleted
            };
          });
        simpleRequests = [...simpleRequests, ...newRequests];
      }
      
      // contractor_quotes와 연결 (오류가 없으면)
      if (!quotesError && myQuotes) {
        myQuotes.forEach(quote => {
          // 해당 project_id를 가진 요청 찾기
          const existingRequest = simpleRequests.find(r => r.id === quote.project_id);
          if (existingRequest) {
            const isCompleted = existingRequest.status === 'completed' || existingRequest.status === 'closed';
            existingRequest.myQuote = {
              id: quote.id,
              estimated_cost: quote.price,
              status: quote.status,
              quote_details: quote.description
            };
            // 완료된 프로젝트는 completed-mine, 아니면 quoted
            existingRequest.category = isCompleted ? 'completed-mine' : 'quoted';
            existingRequest.isEditable = !isCompleted;
            existingRequest.isReadOnly = isCompleted;
          }
        });
      }
      
      console.log('📊 최종 간단한 요청 목록:', {
        total: simpleRequests.length,
        open: simpleRequests.filter(r => r.category === 'open').length,
        quoted: simpleRequests.filter(r => r.category === 'quoted').length,
        'completed-mine': simpleRequests.filter(r => r.category === 'completed-mine').length,
        'completed-other': simpleRequests.filter(r => r.category === 'completed-other').length,
        sample: simpleRequests[0]
      });
      
      setQuoteRequests(simpleRequests);
      
      // 고유한 customer_id 목록 추출
      const customerIds = [...new Set(simpleRequests.map(r => r.customer_id).filter(id => id))];
      
      console.log('📝 고객 ID 목록:', customerIds);
      
      if (customerIds.length > 0) {
        console.log('🔄 고객 정보 조회 시작...');
        await fetchCustomersInfo(customerIds);
        console.log('✅ 고객 정보 조회 완료');
      } else {
        console.log('⚠️ 조회할 고객 ID가 없습니다');
      }
      
    } catch (error) {
      console.error('❌ 예상치 못한 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersInfo = async (customerIds: string[]) => {
    const infoMap: Record<string, CustomerInfo> = {};

    for (const customerId of customerIds) {
      if (!customerId) continue;
      
      try {
        // users 테이블에서 조회
        console.log(`🔍 고객 정보 조회 시도: ${customerId}`);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, first_name, last_name, phone')
          .eq('id', customerId)
          .maybeSingle(); // single() 대신 maybeSingle() 사용

        if (userData && !userError) {
          const fullName = userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`.trim()
            : userData.first_name || userData.last_name || `고객 ${customerId.slice(0, 8)}`;
            
          infoMap[customerId] = {
            email: userData.email || 'unknown@example.com',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            fullName: fullName,
            phone: userData.phone || undefined,
          };
          console.log(`✅ users에서 조회 성공: ${customerId}`, {
            firstName: userData.first_name,
            lastName: userData.last_name,
            fullName: fullName,
            email: userData.email,
            mapped: infoMap[customerId]
          });
        } else {
          console.log(`⚠️ users 조회 실패, 기본값 사용: ${customerId}`, userError?.message);
          // 조회 실패 시 기본값
          infoMap[customerId] = {
            email: 'unknown@example.com',
            firstName: '',
            lastName: '',
            fullName: `고객 ${customerId.slice(0, 8)}`,
          };
        }
      } catch (error) {
        console.error(`❌ 고객 정보 조회 예외: ${customerId}`, error);
        infoMap[customerId] = {
          email: 'unknown@example.com',
          firstName: '',
          lastName: '',
          fullName: `고객 ${customerId.slice(0, 8)}`,
        };
      }
    }

    console.log(`📇 고객 정보 맵 완성: ${Object.keys(infoMap).length}명`);
    setCustomerInfoMap(infoMap);
  };

  // 개별 고객 정보 조회 함수 (필요 시 사용)
  const fetchSingleCustomerInfo = async (customerId: string): Promise<CustomerInfo | null> => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('email, first_name, last_name, phone, full_address, postal_code, company_name')
        .eq('id', customerId)
        .single();

      if (userData && !error) {
        return {
          email: userData.email || 'unknown@example.com',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Customer',
          phone: userData.phone || undefined,
          address: userData.full_address || undefined,
          postalCode: userData.postal_code || undefined,
          companyName: userData.company_name || undefined
        };
      }
      
      return null;
    } catch (error) {
      console.error('고객 정보 조회 실패:', error);
      return null;
    }
  };

  // 견적 상태별 통계
  const getProjectStats = () => {
    const stats = {
      total: quoteRequests.length,
      open: quoteRequests.filter(r => r.category === 'open').length,
      quoted: quoteRequests.filter(r => r.category === 'quoted').length,
      selected: quoteRequests.filter(r => r.category === 'selected').length,
      completed: quoteRequests.filter(r => r.category.startsWith('completed')).length
    };

    return stats;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
    );
  }

  const stats = getProjectStats();

  // 예산 표시 함수
  const formatBudget = (budget: string) => {
    switch (budget) {
      case 'under_50k':
        return '$50,000 미만';
      case '50k_100k':
        return '$50,000 - $100,000';
      case 'over_100k':
        return '$100,000 이상';
      default:
        return '미정';
    }
  };

  // 공간 타입 한글 변환
  const formatSpaceType = (spaceType: string) => {
    switch (spaceType) {
      case 'detached_house':
        return 'Detached House';
      case 'town_house':
        return 'Town House';
      case 'condo':
        return 'Condo';
      case 'commercial':
        return 'Commercial';
      default:
        return spaceType;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">프로젝트 목록 ({stats.total}개)</h1>
          </div>
          
      {/* 프로젝트 카드 그리드 */}
      {quoteRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">아직 견적 가능한 프로젝트가 없습니다.</div>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quoteRequests.map((request) => {
            const customerInfo = customerInfoMap[request.customer_id];
            
            // 고객 정보 디버깅 (한 번만 로그)
            if (!customerInfo && Math.random() < 0.1) { // 10% 확률로만 로그
              console.log(`❌ 고객 정보 없음: ${request.customer_id}`, {
                customerInfoMapKeys: Object.keys(customerInfoMap),
                requestCustomerId: request.customer_id,
                customerInfoMapSize: Object.keys(customerInfoMap).length
              });
            }
            
            // 카테고리별 배지 색상
            const getBadgeStyle = (category: string) => {
              switch (category) {
                case 'open':
                  return 'bg-green-100 text-green-800';
                case 'quoted':
                  return 'bg-blue-100 text-blue-800';
                case 'selected':
                  return 'bg-purple-100 text-purple-800';
                case 'completed-mine':
                  return 'bg-gray-100 text-gray-800';
                case 'completed-lost':
                  return 'bg-red-100 text-red-800';
                case 'completed-other':
                  return 'bg-gray-100 text-gray-600';
                default:
                  return 'bg-gray-100 text-gray-700';
              }
            };

            const getBadgeText = (category: string) => {
              switch (category) {
                case 'open':
                  return '견적가능';
                case 'quoted':
                  return '견적제출';
                case 'selected':
                  return '선택됨';
                case 'completed-mine':
                  return '완료';
                case 'completed-lost':
                  return '낙찰실패';
                case 'completed-other':
                  return '완료';
                default:
                  return '기타';
              }
            };
            
            return (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 카드 헤더 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatSpaceType(request.space_type)}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getBadgeStyle(request.category)}`}>
                      {getBadgeText(request.category)}
                    </span>
        </div>
        
                  {/* 고객 정보 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">고</span>
      </div>
              <div>
                      <div className="text-sm font-medium">
                        {customerInfo?.fullName && 
                         customerInfo.fullName !== `고객 ${request.customer_id.slice(0, 8)}` &&
                         customerInfo.fullName.trim() !== ''
                          ? customerInfo.fullName 
                          : `고객 ${request.customer_id.slice(0, 8)}`}
              </div>
                      {/* 이메일 표시 제거 */}
                      <div className="text-xs text-gray-500">
                        ID: {request.customer_id.slice(0, 8)}...
          </div>
        </div>
      </div>
      
                  <div className="text-sm text-gray-600">
                    {request.project_types.join(', ')}
          </div>
        </div>
        
                {/* 카드 본문 */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* 예산 정보 */}
                    <div>
                      <span className="text-sm font-medium">예산: </span>
                      <span className="text-sm">{formatBudget(request.budget)}</span>
                    </div>

                    {/* 일정 정보 */}
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">일정</span>
                        <div>{request.timeline}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">등록일</span>
                        <div>{new Date(request.created_at).toLocaleDateString('ko-KR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                    </div>

                    {/* 위치 */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{request.postal_code || '주소 미입력'}</span>
                    </div>
              </div>
              
                  {/* 제출 견적 */}
                  {request.myQuote ? (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-1 text-green-700 text-sm mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {request.category === 'selected' || request.category === 'completed-mine' 
                          ? '고객이 선택했습니다' 
                          : '견적을 제출했습니다'
                        }
                      </div>
                      <div className="text-lg font-bold">
                        제출 견적: ${request.myQuote.estimated_cost.toLocaleString()}
                      </div>
                    </div>
                  ) : request.isEditable && !request.isReadOnly ? (
                    /* 견적 제출 버튼 (활성 프로젝트만) */
                    <div className="mt-4">
                      <button className="w-full py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        현장방문 신청
                      </button>
                </div>
              ) : (
                    /* 완료된 프로젝트 표시 */
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center text-sm text-gray-500">
                        {request.category === 'completed-mine' ? '완료된 프로젝트 (내가 수주)' : 
                         request.category === 'completed-other' ? '완료된 프로젝트 (다른 업체)' : 
                         '현장방문 불가'}
                      </div>
                    </div>
                  )}
                  
                  {/* 견적 기간 */}
                  <div className="mt-2 text-center">
                    <button className="text-gray-400 text-sm">
                      등록된 견적: {request.myQuote ? '1개' : '0개'} ▼
                    </button>
                  </div>
                </div>
            </div>
            );
          })}
          </div>
        )}
    </div>
  );
}