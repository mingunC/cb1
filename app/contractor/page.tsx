'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, DollarSign, FileText, Upload, Calendar, MapPin, Clock, CheckCircle, XCircle, Image, Plus, Minus, RefreshCw, X, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast' // or react-toastify
import PortfolioManager from '@/components/PortfolioManager'

// 프로젝트 타입 정보 함수
const getProjectTypeInfo = (type: string) => {
  const typeMap: Record<string, { label: string; color: string }> = {
    'kitchen': { label: '주방', color: 'bg-orange-100 text-orange-700' },
    'bathroom': { label: '욕실', color: 'bg-blue-100 text-blue-700' },
    'basement': { label: '지하실', color: 'bg-gray-100 text-gray-700' },
    'flooring': { label: '바닥재', color: 'bg-amber-100 text-amber-700' },
    'painting': { label: '페인팅', color: 'bg-purple-100 text-purple-700' },
    'full_renovation': { label: '전체 리노베이션', color: 'bg-red-100 text-red-700' },
    'office': { label: '사무실', color: 'bg-indigo-100 text-indigo-700' },
    'retail': { label: '상가/매장', color: 'bg-green-100 text-green-700' },
    'restaurant': { label: '카페/식당', color: 'bg-yellow-100 text-yellow-700' },
    'education': { label: '학원/교육', color: 'bg-pink-100 text-pink-700' },
    'hospitality': { label: '숙박/병원', color: 'bg-teal-100 text-teal-700' },
    'other': { label: '기타', color: 'bg-gray-100 text-gray-700' }
  }
  
  return typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
}

// 부동산 유형 정보 함수
const getSpaceTypeInfo = (spaceType: string) => {
  const spaceTypeMap: Record<string, { label: string; color: string }> = {
    'detached_house': { label: 'Detached House', color: 'bg-green-100 text-green-700' },
    'town_house': { label: 'Town House', color: 'bg-blue-100 text-blue-700' },
    'condo': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' },
    'commercial': { label: 'Commercial', color: 'bg-orange-100 text-orange-700' },
    // 추가 매핑 (혹시 다른 값이 저장된 경우)
    'detached-house': { label: 'Detached House', color: 'bg-green-100 text-green-700' },
    'townhouse': { label: 'Town House', color: 'bg-blue-100 text-blue-700' },
    'apartment': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' },
    'condo-apartment': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' }
  }
  
  return spaceTypeMap[spaceType] || { label: spaceType, color: 'bg-gray-100 text-gray-700' }
}

// 명확한 프로젝트 상태 타입 정의
type ProjectStatus = 
  | 'pending'              // 고객 견적요청 (대기중)
  | 'approved'             // 관리자 승인됨
  | 'site-visit-applied'   // 현장방문 신청함
  | 'site-visit-completed' // 현장방문 완료
  | 'quoted'               // 견적서 제출함
  | 'selected'             // 고객에게 선택됨
  | 'not-selected'         // 선택 안됨
  | 'completed'            // 완료됨
  | 'cancelled'            // 취소됨

interface Project {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date?: string
  visit_dates?: string[]
  full_address: string
  postal_code: string
  description: string
  photos?: any[]
  status: string
  status_detail?: string
  created_at: string
  updated_at: string

  // 관계 데이터
  site_visit_application?: {
  id: string
  contractor_id: string
    is_cancelled: boolean
    applied_at: string
  }
  contractor_quote?: {
    id: string
    price: number
    description: string | null
    detailed_description?: string | null
    pdf_url: string | null
    pdf_filename?: string | null
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'submitted'
    created_at: string
  }
  
  // 프로젝트 상태 (클라이언트 계산용)
  projectStatus?: ProjectStatus
}

interface ContractorData {
  id: string
  company_name: string
  contact_name: string
  status: string
}

// 현장방문 누락 여부 확인 함수
function isSiteVisitMissed(project: Project, contractorId: string): boolean {
  // 프로젝트가 현장방문 단계를 지나갔지만 본인이 신청하지 않은 경우
  if (project.status === 'site-visit-pending' || project.status === 'site-visit-completed' || project.status === 'bidding') {
    // 본인이 현장방문을 신청하지 않았고, 다른 업체가 신청한 경우
    const hasOtherApplications = project.site_visit_applications?.some(
      (app: any) => app.contractor_id !== contractorId
    )
    
    return !project.site_visit_application && hasOtherApplications
  }
  
  return false
}

// 프로젝트 상태 계산 함수
function calculateProjectStatus(project: Project, contractorId: string): ProjectStatus {
  // 1. 견적서를 제출한 경우
  if (project.contractor_quote) {
    if (project.contractor_quote.status === 'accepted') return 'selected'
    if (project.contractor_quote.status === 'rejected') return 'not-selected'
    return 'quoted'
  }
  
  // 2. 현장방문 신청한 경우
  if (project.site_visit_application) {
    
    // 취소된 경우 다시 신청 가능하도록 pending 상태로 처리
    if (project.site_visit_application.is_cancelled) {
      return 'pending'
    }
    // 활성 신청인 경우
    if (project.status === 'site-visit-completed' || project.status === 'bidding') return 'site-visit-completed'
    return 'site-visit-applied'
  }
  
  // 3. 기본 상태에 따른 분류
  if (project.status === 'cancelled') return 'cancelled'
  if (project.status === 'completed') return 'completed'
  if (project.status === 'quote-submitted') return 'quoted'
  if (project.status === 'approved' || project.status === 'site-visit-pending') return 'approved'
  
  return 'pending'
}

// 상태별 배지 컴포넌트
const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const configs = {
    'pending': { color: 'bg-gray-100 text-gray-800', label: '대기중' },
    'approved': { color: 'bg-green-100 text-green-800', label: '승인됨' },
    'site-visit-applied': { color: 'bg-purple-100 text-purple-800', label: '현장방문 신청' },
    'site-visit-completed': { color: 'bg-indigo-100 text-indigo-800', label: '현장방문 완료' },
    'quoted': { color: 'bg-yellow-100 text-yellow-800', label: '견적서 제출' },
    'selected': { color: 'bg-green-100 text-green-800', label: '선택됨' },
    'not-selected': { color: 'bg-red-100 text-red-800', label: '미선택' },
    'completed': { color: 'bg-gray-100 text-gray-800', label: '완료' },
    'cancelled': { color: 'bg-red-100 text-red-800', label: '취소' }
  }
  
  const config = configs[status] || configs['pending']
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function IntegratedContractorDashboard() {
  const router = useRouter()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [contractorData, setContractorData] = useState<ContractorData | null>(null)
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [itemsPerPage] = useState(9) // 한 번에 로드할 프로젝트 수
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolio'>('projects')
  const [quoteModal, setQuoteModal] = useState<{
    isOpen: boolean
    projectId: string | null
    mode: 'create' | 'view'
    project: Project | null
  }>({
    isOpen: false,
    projectId: null,
    mode: 'create',
    project: null
  })

  // 무한 스크롤을 위한 데이터 페칭 함수
  const fetchProjectsData = useCallback(async (contractorId: string, offset: number = 0, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setError(null)
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const supabase = createBrowserClient()
      
      // quote_requests 목록 조회 (방문 신청 정보 포함)
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          site_visit_applications (
            id,
            contractor_id,
            status,
            applied_at,
            is_cancelled,
            cancelled_at,
            cancelled_by,
            contractors (
              id,
              company_name,
              contact_name
            )
          ),
          contractor_quotes!left (
            id,
            contractor_id,
            price,
            description,
            pdf_url,
            status,
            created_at
          )
        `)
        .or(`status.eq.site-visit-pending,status.eq.site-visit-completed,status.eq.bidding,status.eq.quote-submitted,status.eq.completed,status.eq.cancelled`)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1)

      if (projectsError) throw projectsError

      

      // 프로젝트별로 업체와의 관계 데이터 필터링 및 상태 계산
      const processedProjects: Project[] = (projectsData || []).map(project => {
        // 현재 업체의 현장방문 신청 찾기 (취소되지 않은 활성 신청만)
        const mySiteVisit = project.site_visit_applications?.find(
          (app: any) => app.contractor_id === contractorId && !app.is_cancelled
        )
        
        // 현재 업체의 모든 현장방문 신청 찾기 (취소된 것 포함)
        const allMySiteVisits = project.site_visit_applications?.filter(
          (app: any) => app.contractor_id === contractorId
        )
        
        // 현재 업체의 견적서 찾기
        const myQuote = project.contractor_quotes?.find(
          (quote: any) => quote.contractor_id === contractorId
        )
        
        // 다른 업체가 이미 신청했는지 확인
        const hasOtherApplications = project.site_visit_applications?.some(
          (app: any) => app.contractor_id !== contractorId
        )
        
        // 프로젝트 상태 계산 - 데이터 일관성 유지
        const siteVisitForStatus = allMySiteVisits?.[0] // 취소된 신청도 포함
        const processedProject: Project = {
          ...project,
          site_visit_application: siteVisitForStatus, // 상태 계산과 동일한 데이터 사용
          contractor_quote: myQuote,
          projectStatus: calculateProjectStatus({
            ...project,
            site_visit_application: siteVisitForStatus,
            contractor_quote: myQuote
          }, contractorId)
        }
        
        return processedProject
      })
      
      // 무한 스크롤을 위한 데이터 처리
      const relevantProjects = processedProjects
      
      if (isLoadMore) {
        // 추가 로드인 경우 기존 데이터에 추가
        setProjects(prev => [...prev, ...relevantProjects])
        setCurrentOffset(prev => prev + itemsPerPage)
      } else {
        // 초기 로드인 경우 데이터 교체
        setProjects(relevantProjects)
        setCurrentOffset(itemsPerPage)
      }
      
      // 더 이상 로드할 데이터가 없는지 확인
      setHasMore(relevantProjects.length === itemsPerPage)
      
      
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error)
      setError('프로젝트 데이터를 불러오는데 실패했습니다.')
      toast.error('데이터 로드 실패')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [itemsPerPage])

  // 인증 체크 및 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // 업체 정보 확인
        const { data: contractorInfo, error: contractorError } = await supabase
          .from('contractors')
          .select('id, company_name, contact_name, status')
          .eq('user_id', user.id)
          .single()

        if (contractorError || !contractorInfo) {
          toast.error('업체 권한이 필요합니다')
          router.push('/')
          return
        }
        
        setContractorData(contractorInfo)
        await fetchProjectsData(contractorInfo.id, 0, false)
        
      } catch (error) {
        console.error('초기화 오류:', error)
        toast.error('시스템 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

    initializeData()
  }, [router]) // fetchProjectsData 의존성 제거하여 무한루프 방지

  // 새로고침 함수
  const refreshData = useCallback(async () => {
    if (!contractorData) return
    
    setIsRefreshing(true)
    setCurrentOffset(0)
    setHasMore(true)
    await fetchProjectsData(contractorData.id, 0, false)
    setIsRefreshing(false)
    toast.success('데이터를 새로고침했습니다')
  }, [contractorData]) // fetchProjectsData 의존성 제거

  // 무한 스크롤을 위한 추가 데이터 로드 함수
  const loadMoreProjects = useCallback(async () => {
    if (!contractorData || isLoadingMore || !hasMore) return
    
    await fetchProjectsData(contractorData.id, currentOffset, true)
  }, [contractorData, isLoadingMore, hasMore, currentOffset]) // fetchProjectsData 의존성 제거

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
      loadMoreProjects()
    }
  }, [loadMoreProjects])

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 필터 변경 시 데이터 리셋
  const handleFilterChange = useCallback((filter: ProjectStatus | 'all') => {
    setProjectFilter(filter)
    setCurrentOffset(0)
    setHasMore(true)
    // 필터 변경 시에는 모든 데이터를 다시 로드
    if (contractorData) {
      fetchProjectsData(contractorData.id, 0, false)
    }
  }, [contractorData, fetchProjectsData])

  // 현장방문 신청 핸들러
  const handleSiteVisitApplication = useCallback(async (quoteRequestId: string) => {
    if (!confirm('현장방문을 신청하시겠습니까?')) return

    try {
      const supabase = createBrowserClient()
      
      // 1. 현재 로그인한 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 2. contractors 테이블에서 contractor_id 가져오기
      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (contractorError || !contractor) {
        console.error('Contractor 정보 조회 오류:', contractorError);
        toast.error('Contractor 등록이 필요합니다.');
        return;
      }

      // 3. 기존 신청 체크 (취소된 것 포함 모두)
      const { data: existingApplication, error: checkError } = await supabase
        .from('site_visit_applications')
        .select('*')
        .eq('project_id', quoteRequestId)
        .eq('contractor_id', contractor.id)
        .single(); // 모든 신청 체크

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 row not found 에러
        console.error('중복 체크 오류:', checkError);
        throw checkError;
      }

      // 취소된 신청이 있으면 재활성화
      if (existingApplication && existingApplication.is_cancelled) {
        const { data: reactivated, error: updateError } = await supabase
          .from('site_visit_applications')
          .update({
            is_cancelled: false,
            cancelled_at: null,
            cancelled_by: null,
            status: 'pending',
            applied_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
          .select()
          .single();

        if (updateError) {
          console.error('재활성화 오류:', updateError);
          throw updateError;
        }

        console.log('방문 신청 재활성화:', reactivated);
        toast.success('방문 신청이 다시 활성화되었습니다!');
        await refreshData();
        return;
      }

      // 활성 신청이 이미 있는 경우
      if (existingApplication && !existingApplication.is_cancelled) {
        toast.error('이미 이 프로젝트에 방문 신청을 하셨습니다.');
        return;
      }

      // 4. 신청이 전혀 없는 경우에만 새로 생성
      const { data: newApplication, error: insertError } = await supabase
        .from('site_visit_applications')
        .insert([
          {
            project_id: quoteRequestId,
            contractor_id: contractor.id,
            status: 'pending',
            notes: '',
            is_cancelled: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('방문 신청 생성 오류:', insertError);
        throw insertError;
      }

      console.log('방문 신청 성공:', newApplication);
      toast.success('방문 신청이 완료되었습니다!');
      
      // 5. 데이터 새로고침
      await refreshData();
      
    } catch (error) {
      console.error('방문 신청 처리 중 오류:', error);
      toast.error('방문 신청 중 오류가 발생했습니다.');
    }
  }, [refreshData])

  // 현장방문 취소 핸들러 (완전 개선)
  const handleSiteVisitCancellation = useCallback(async (applicationId: string, projectId: string) => {
    if (!confirm('현장방문 신청을 취소하시겠습니까?\n나중에 다시 신청할 수 있습니다.')) return

    try {
      const supabase = createBrowserClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Authentication error:', userError)
        toast.error('로그인이 필요합니다')
        return
      }

      // 2. site_visit_applications 취소
      const { data: svaData, error: svaError } = await supabase
        .from('site_visit_applications')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id
        })
        .eq('id', applicationId)
        .select()


      if (svaError) {
        console.error('SVA Error:', svaError)
        toast.error(`취소 실패: ${svaError.message}`)
        return
      }

      if (!svaData || svaData.length === 0) {
        console.error('취소할 현장방문 신청을 찾을 수 없습니다')
        toast.error('취소할 현장방문 신청을 찾을 수 없습니다')
        return
      }

      // 3. quote_requests 상태는 그대로 유지 (현장방문 신청 가능한 상태 유지)
      // 취소된 현장방문 신청은 site_visit_applications에서만 처리
      // status를 변경하지 않아서 프로젝트가 사라지지 않음

      
    } catch (error) {
      console.error('Error:', error)
      toast.error('오류가 발생했습니다')
    }
  }, [refreshData])

  // 견적서 작성 모달 열기
  const openQuoteCreateModal = (project: Project) => {
    setQuoteModal({
      isOpen: true,
      projectId: project.id,
      mode: 'create',
      project
    })
  }

  // 견적서 보기 모달 열기
  const openQuoteViewModal = (project: Project) => {
    setQuoteModal({
      isOpen: true,
      projectId: project.id,
      mode: 'view',
      project
    })
  }

  // 견적서 모달 닫기
  const closeQuoteModal = () => {
    setQuoteModal({
      isOpen: false,
      projectId: null,
      mode: 'create',
      project: null
    })
  }

  // 필터링된 프로젝트 (메모이제이션) - 무한 스크롤에서는 클라이언트 사이드 필터링
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects
    return projects.filter(p => p.projectStatus === projectFilter)
  }, [projects, projectFilter])

  // 상태별 카운트 (메모이제이션)
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus | 'all', number> = {
      'all': projects.length,
      'pending': 0,
      'approved': 0,
      'site-visit-applied': 0,
      'site-visit-completed': 0,
      'quoted': 0,
      'selected': 0,
      'not-selected': 0,
      'completed': 0,
      'cancelled': 0
    }
    
    projects.forEach(p => {
      if (p.projectStatus) {
        counts[p.projectStatus]++
      }
    })
    
    return counts
  }, [projects])

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 메인 렌더링
  return (
    <Fragment>
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 제목 및 새로고침 버튼 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </button>
              <h1 className="text-lg font-semibold text-gray-900">내 프로젝트 관리</h1>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 메인 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                프로젝트 관리
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                포트폴리오 관리
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 내용 */}
        {activeTab === 'projects' && (
          <>
            {/* 필터 탭 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'approved', 'site-visit-applied', 'site-visit-completed', 'quoted', 'selected', 'not-selected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setProjectFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  projectFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '전체' :
                 status === 'approved' ? '승인됨' :
                 status === 'site-visit-applied' ? '현장방문 신청' :
                 status === 'site-visit-completed' ? '현장방문 완료' :
                 status === 'quoted' ? '견적 제출' :
                 status === 'selected' ? '선택됨' :
                 status === 'not-selected' ? '미선택' : status}
                <span className="ml-2 text-xs">({statusCounts[status]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              프로젝트 목록 ({filteredProjects.length}개)
            </h3>
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              해당하는 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    {/* 카드 헤더 */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {getSpaceTypeInfo(project.space_type).label}
                        </h4>
                        <StatusBadge status={project.projectStatus!} />
                      </div>
                      
                      {/* 프로젝트 타입 배지들 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.project_types?.map((type, index) => {
                          const typeInfo = getProjectTypeInfo(type)
                          return (
                            <div
                              key={index}
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </div>
                          )
                        }) || (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            프로젝트
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">예산: </span>
                        {project.budget === 'under_50k' ? '$50,000 미만' :
                         project.budget === '50k_100k' ? '$50,000-$100,000' :
                         project.budget === 'over_100k' ? '$100,000 이상' : project.budget}
                      </div>
                    </div>

                    {/* 카드 바디 */}
                    <div className="p-4 space-y-3">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium text-xs">일정</span>
                          <span className="text-gray-900 font-medium">
                            {project.timeline === 'immediate' ? '즉시 시작' :
                             project.timeline === '1_month' ? '1개월 내' :
                             project.timeline === '3_months' ? '3개월 내' :
                             project.timeline === 'planning' ? '계획중' : project.timeline}
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-gray-500 font-medium text-xs">방문일</span>
                          <span className="text-gray-900 font-medium">
                            {project.visit_date 
                              ? new Date(project.visit_date).toLocaleDateString('ko-KR')
                              : project.visit_dates && project.visit_dates.length > 0 
                                ? new Date(project.visit_dates[0]).toLocaleDateString('ko-KR')
                                : '미정'
                            }
                          </span>
                        </div>
                      </div>

                      {/* 주소 */}
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{project.full_address}</span>
                      </div>

                      {/* 프로젝트 요구사항 */}
                      {project.description && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">요구사항:</span>
                            <p className="mt-1 text-gray-600 line-clamp-3">{project.description}</p>
                          </div>
                        </div>
                      )}

                      {/* 등록일 */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>등록일: {new Date(project.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>

                      {/* 견적 정보 */}
                      {project.contractor_quote && (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700 font-medium">
                            제출 견적: ${project.contractor_quote.price.toLocaleString()}
                          </p>
                          {project.contractor_quote.status === 'accepted' && (
                            <p className="text-sm text-green-600 mt-1 font-medium">✓ 고객이 선택했습니다</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 카드 푸터 - 액션 버튼 */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-col gap-2">
                        
                        {/* 현장방문 누락 표시 */}
                        {isSiteVisitMissed(project, contractorData?.id || '') && (
                          <div className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium flex items-center justify-center gap-2">
                            <XCircle className="h-4 w-4" />
                            현장방문 누락
                          </div>
                        )}
                        
                        {/* 현장방문 신청 버튼 - 신청 가능한 상태 */}
                        {(project.projectStatus === 'approved' || project.projectStatus === 'pending') && 
                         !isSiteVisitMissed(project, contractorData?.id || '') && (
                          <button
                            onClick={() => handleSiteVisitApplication(project.id)}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            현장방문 신청
                          </button>
                        )}
                        
                        {/* 현장방문 취소 버튼 */}
                        {project.projectStatus === 'site-visit-applied' && project.site_visit_application && (
                          <button
                            onClick={() => handleSiteVisitCancellation(project.site_visit_application!.id, project.id)}
                            disabled={project.site_visit_application.is_cancelled}
                            className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              project.site_visit_application.is_cancelled
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            <Minus className="h-4 w-4" />
                            {project.site_visit_application.is_cancelled ? '취소됨' : '현장방문 취소'}
                          </button>
                        )}
                        
                        {/* 견적서 작성 버튼 */}
                        {project.projectStatus === 'site-visit-completed' && !project.contractor_quote && !isSiteVisitMissed(project, contractorData?.id || '') && (
                          <button
                            onClick={() => openQuoteCreateModal(project)}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            견적서 작성
                          </button>
                        )}
                        
                        {/* 견적서 보기 버튼 */}
                        {project.projectStatus === 'quoted' && project.contractor_quote && (
                          <button
                            onClick={() => openQuoteViewModal(project)}
                            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            견적서 보기
                          </button>
                        )}
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 무한 스크롤 로딩 인디케이터 */}
              {isLoadingMore && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>더 많은 프로젝트를 불러오는 중...</span>
                  </div>
                </div>
              )}
              
              {/* 더 이상 로드할 데이터가 없을 때 */}
              {!hasMore && filteredProjects.length > 0 && (
                <div className="mt-8 text-center text-gray-500">
                  모든 프로젝트를 불러왔습니다.
                </div>
              )}
            </div>
          )}
        </div>
          </>
        )}

        {/* 포트폴리오 탭 내용 */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {contractorData && (
                <PortfolioManager 
                  contractorId={contractorData.id}
                  onPortfolioUpdate={() => {
                    // 포트폴리오 업데이트 시 필요한 로직
                    console.log('Portfolio updated')
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 견적서 작성/보기 모달 */}
    {quoteModal.isOpen && (
      <QuoteModal
        isOpen={quoteModal.isOpen}
        onClose={closeQuoteModal}
        project={quoteModal.project}
        mode={quoteModal.mode}
        contractorId={contractorData?.id}
        onSuccess={() => {
          closeQuoteModal()
          refreshData()
        }}
      />
    )}
  </Fragment>
  )
}

// 견적서 모달 컴포넌트 (White & Gold Theme)
interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  mode: 'create' | 'view'
  contractorId?: string
  onSuccess: () => void
}

function QuoteModal({ isOpen, onClose, project, mode, contractorId, onSuccess }: QuoteModalProps) {
  const [price, setPrice] = useState('')
  const [priceDisplay, setPriceDisplay] = useState('') // 포맷된 표시용
  const [detailedDescription, setDetailedDescription] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 금액 포맷팅 함수
  const formatPrice = (value: string) => {
    // 숫자만 추출
    const numericValue = value.replace(/[^0-9]/g, '')
    // 천 단위 구분자 추가
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 금액 입력 핸들러
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = value.replace(/[^0-9]/g, '')
    setPrice(numericValue)
    setPriceDisplay(formatPrice(numericValue))
  }

  useEffect(() => {
    if (mode === 'view' && project?.contractor_quote) {
      const priceValue = project.contractor_quote.price?.toString() || ''
      setPrice(priceValue)
      setPriceDisplay(formatPrice(priceValue))
      setDetailedDescription(project.contractor_quote.description || '')
    } else {
      // Reset form when opening in create mode or for a new project
      setPrice('')
      setPriceDisplay('')
      setDetailedDescription('')
      setPdfFile(null)
    }
  }, [mode, project?.id]) // project 전체 대신 project.id만 의존성으로 사용

  // 견적서 업로드 함수
  const uploadQuote = async (file: File, projectId: string, contractorId: string) => {
    const supabase = createBrowserClient()
    const fileName = `${projectId}_${contractorId}_${Date.now()}.pdf`
    
    const { data, error } = await supabase.storage
      .from('contractor-quotes')
      .upload(fileName, file)
    
    if (error) throw error
    
    return {
      pdfUrl: fileName,
      pdfFilename: file.name
    }
  }

  // 견적서 다운로드 함수
  const downloadQuote = async (pdfUrl: string) => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.storage
      .from('contractor-quotes')
      .createSignedUrl(pdfUrl, 3600)
    
    if (error) throw error
    
    window.open(data.signedUrl, '_blank')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !contractorId) return

    if (!pdfFile) {
      toast.error('상세 견적서 PDF 파일을 업로드해주세요.')
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const supabase = createBrowserClient()

      // PDF 업로드
      const uploadResult = await uploadQuote(pdfFile, project.id, contractorId)
      
      // contractor_quotes 테이블이 존재하는지 확인하고 저장 시도
      try {
        const { error } = await supabase
          .from('contractor_quotes')
          .insert({
            project_id: project.id,
            contractor_id: contractorId,
            price: parseFloat(price),
            description: detailedDescription,
            pdf_url: uploadResult.pdfUrl,
            pdf_filename: uploadResult.pdfFilename,
            status: 'pending', // 'submitted' 대신 'pending' 사용
            created_at: new Date().toISOString()
          })

        if (error) {
          console.warn('contractor_quotes 테이블 저장 실패, 기존 방식으로 fallback:', error)
          // 기존 방식으로 fallback - 별도 필드들로 저장
          await supabase
            .from('quote_requests')
            .update({ 
              status: 'quote-submitted',
              contractor_price: parseFloat(price),
              contractor_description: detailedDescription,
              contractor_pdf_url: uploadResult.pdfUrl,
              contractor_pdf_filename: uploadResult.pdfFilename,
              contractor_quote_status: 'pending'
            })
            .eq('id', project.id)
        } else {
          // contractor_quotes 테이블 저장 성공 시 quote_requests 상태만 업데이트
          await supabase
            .from('quote_requests')
            .update({ status: 'quote-submitted' })
            .eq('id', project.id)
        }
      } catch (tableError) {
        console.warn('contractor_quotes 테이블 접근 실패, 기존 방식으로 fallback:', tableError)
        // 기존 방식으로 fallback - 별도 필드들로 저장
        await supabase
          .from('quote_requests')
          .update({ 
            status: 'quote-submitted',
            contractor_price: parseFloat(price),
            contractor_description: detailedDescription,
            contractor_pdf_url: uploadResult.pdfUrl,
            contractor_pdf_filename: uploadResult.pdfFilename,
            contractor_quote_status: 'pending'
          })
          .eq('id', project.id)
      }

      toast.success('견적서가 성공적으로 제출되었습니다!')
      onSuccess()
    } catch (error) {
      console.error('견적서 제출 오류:', error)
      toast.error('견적서 제출 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* --- NEW: Modal Header --- */}
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {mode === 'create' ? '견적서 작성' : '제출된 견적서'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {project.full_address}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* --- Modal Content --- */}
        <div className="p-8 overflow-y-auto">
        {mode === 'create' ? (
          /* --- NEW: Create Form Design --- */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: 견적 금액 */}
            <div>
              <label htmlFor="price" className="flex items-center gap-3 mb-3">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <span className="text-md font-semibold text-gray-700">총 견적 금액 (CAD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="price"
                  type="text"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  placeholder="50,000"
                  required
                />
              </div>
            </div>

            {/* Section 2: 상세 작업 내용 (Optional) */}
            <div>
               <label htmlFor="detailed-description" className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <span className="text-md font-semibold text-gray-700">상세 작업 내용</span>
              </label>
              <textarea
                id="detailed-description"
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                rows={6}
                placeholder="고객에게 어필할 수 있는 작업 내용을 작성해주세요 (선택사항)"
              />
            </div>

            {/* Section 3: PDF 업로드 */}
            <div>
              <label className="flex items-center gap-3 mb-3">
                <Upload className="h-5 w-5 text-amber-500" />
                <span className="text-md font-semibold text-gray-700">상세 견적서 (PDF) *</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">
                    {pdfFile ? pdfFile.name : '파일을 선택하거나 여기에 드래그하세요.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF 파일 업로드 (필수)
                  </p>
                </label>
              </div>
            </div>

            {/* --- NEW: Action Buttons --- */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-transparent border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-semibold"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    제출 중...
                  </>
                ) : '견적서 제출'
                }
              </button>
            </div>
          </form>
        ) : (
          /* --- View Mode (Slightly updated for consistency) --- */
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">견적 금액</h3>
              <p className="text-3xl font-bold text-amber-600">
                ${priceDisplay || '0'} <span className="text-xl font-medium text-gray-500">CAD</span>
              </p>
            </div>

            <div className="space-y-4">
              {detailedDescription && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-2">상세 작업 내용</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{detailedDescription}</p>
                </div>
              )}
            </div>

            {project.contractor_quote?.pdf_url && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-2">첨부된 상세 견적서</h3>
                <button
                  onClick={async () => {
                    if (!project.contractor_quote?.pdf_url) return
                    try {
                      await downloadQuote(project.contractor_quote.pdf_url)
                    } catch (error) {
                      toast.error('PDF 파일을 다운로드할 수 없습니다.')
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {project.contractor_quote.pdf_filename || '견적서 다운로드'}
                </button>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}