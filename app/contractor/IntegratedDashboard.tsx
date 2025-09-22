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

interface Project {
  id: string;
  customer_id: string;
  title?: string;
  description?: string;
  status?: string;
  created_at: string;
  // 다른 프로젝트 필드들...
}

export default function IntegratedDashboard({ contractorId }: { contractorId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customerInfoMap, setCustomerInfoMap] = useState<Record<string, CustomerInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractorId) {
      fetchProjects();
    }
  }, [contractorId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // quote_requests 또는 projects 테이블에서 조회
      const { data: projectsData, error } = await supabase
        .from('quote_requests') // 또는 'projects'
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('프로젝트 조회 오류:', error);
        return;
      }

      if (projectsData && projectsData.length > 0) {
        console.log('Projects data:', projectsData);
        setProjects(projectsData);
        
        // 고유한 customer_id 목록 추출
        const customerIds = [...new Set(projectsData.map(p => p.customer_id).filter(id => id))];
        
        if (customerIds.length > 0) {
          await fetchCustomersInfo(customerIds);
        }
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersInfo = async (customerIds: string[]) => {
    const infoMap: Record<string, CustomerInfo> = {};

    for (const customerId of customerIds) {
      if (!customerId) continue;
      
      try {
        // users 테이블에서 고객 정보 조회 (실제 컬럼명 사용)
        const { data: userData, error } = await supabase
          .from('users')
          .select('email, first_name, last_name, phone, full_address, postal_code, company_name')
          .eq('id', customerId)
          .single();

        if (userData && !error) {
          infoMap[customerId] = {
            email: userData.email || 'unknown@example.com',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Customer',
            phone: userData.phone || undefined,
            address: userData.full_address || undefined,
            postalCode: userData.postal_code || undefined,
            companyName: userData.company_name || undefined
          };
          
          console.log(`고객 정보 조회 성공: ${customerId}`, infoMap[customerId]);
        } else {
          // 조회 실패 시 기본값
          console.warn(`고객 정보 조회 실패 for customer_id: ${customerId}`, error);
          infoMap[customerId] = {
            email: 'unknown@example.com',
            firstName: '',
            lastName: '',
            fullName: 'Customer',
          };
        }
      } catch (error) {
        console.error(`고객 정보 조회 오류 for customer_id: ${customerId}`, error);
        infoMap[customerId] = {
          email: 'unknown@example.com',
          firstName: '',
          lastName: '',
          fullName: 'Customer',
        };
      }
    }

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

  // 프로젝트 상태별 통계
  const getProjectStats = () => {
    const stats = {
      total: projects.length,
      pending: 0,
      inProgress: 0,
      completed: 0
    };

    projects.forEach(project => {
      switch (project.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }
    });

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

  return (
    <div className="p-6">
      {/* 대시보드 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">업체 대시보드</h1>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">전체 프로젝트</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">대기중</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">진행중</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">완료</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">프로젝트 목록</h2>
        </div>
        
        {projects.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            아직 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="divide-y">
            {projects.map((project) => {
              const customerInfo = customerInfoMap[project.customer_id];
              
              return (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {project.title || `프로젝트 #${project.id.slice(0, 8)}`}
                      </h3>
                      
                      {project.description && (
                        <p className="text-gray-600 mb-2">{project.description}</p>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">고객:</span>
                          <span className="font-medium">{customerInfo?.fullName || 'Loading...'}</span>
          </div>
          
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">이메일:</span>
                          <span>{customerInfo?.email || 'Loading...'}</span>
          </div>
          
                        {customerInfo?.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">전화번호:</span>
                            <span>{customerInfo.phone}</span>
            </div>
          )}
          
                        {customerInfo?.companyName && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">회사:</span>
                            <span>{customerInfo.companyName}</span>
            </div>
          )}
          
                        {customerInfo?.address && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">주소:</span>
                            <span>{customerInfo.address} {customerInfo.postalCode}</span>
            </div>
          )}
        </div>
      </div>
                    
                    <div className="ml-4 flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'completed' ? '완료' :
                         project.status === 'in_progress' ? '진행중' : '대기중'}
                      </span>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        {new Date(project.created_at).toLocaleDateString('ko-KR')}
      </div>
      
                      <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        상세보기
              </button>
                </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}