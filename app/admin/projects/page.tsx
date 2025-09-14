'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, User, Phone, Mail } from 'lucide-react'

interface Project {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date: string
  full_address: string
  postal_code: string
  description: string
  photos: any[]
  status: 'pending' | 'approved' | 'in_progress' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<Project | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user || user.email !== 'cmgg919@gmail.com') {
          router.push('/login')
          return
        }
        
        setIsAuthorized(true)
        await fetchProjects()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, filter, searchTerm])

  // 상태 변경 모달 열기
  const openStatusModal = (project: Project) => {
    setSelectedProjectForStatus(project)
    setShowStatusModal(true)
  }

  // 상태 변경 모달 닫기
  const closeStatusModal = () => {
    setShowStatusModal(false)
    setSelectedProjectForStatus(null)
  }

  const fetchProjects = async () => {
    try {
      const supabase = createBrowserClient()
      
      // 승인된 프로젝트만 가져오기 (approved 이상의 상태)
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .in('status', ['approved', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed'])
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching projects:', error)
        return
      }
      
      console.log('Fetched approved projects:', data)
      console.log('Project statuses:', data?.map(p => ({ id: p.id, status: p.status })))
      setProjects(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProjects = () => {
    console.log('Filtering projects. Current projects:', projects)
    console.log('Current filter:', filter)
    console.log('Current searchTerm:', searchTerm)
    
    let filtered = [...projects]

    // 상태 필터
    if (filter !== 'all') {
      filtered = filtered.filter(project => project.status === filter)
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(project => {
        const searchLower = searchTerm.toLowerCase()
        return (
          project.customer_id?.toLowerCase().includes(searchLower) ||
          project.full_address?.toLowerCase().includes(searchLower) ||
          project.space_type?.toLowerCase().includes(searchLower) ||
          project.budget?.toLowerCase().includes(searchLower) ||
          project.project_types?.some(type => type.toLowerCase().includes(searchLower))
        )
      })
    }

    console.log('Filtered results:', filtered)
    setFilteredProjects(filtered)
  }

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      console.log('Updating project status to:', newStatus)
      
      const { data, error } = await supabase
        .from('quote_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating project:', error)
        alert('상태 업데이트 실패: ' + error.message)
        return
      }

      // 로컬 상태 업데이트
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus as any, updated_at: new Date().toISOString() }
          : project
      ))

      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({
          ...selectedProject,
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
      }

      alert(`상태가 "${newStatus}"으로 업데이트되었습니다.`)
    } catch (error) {
      console.error('Error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '대기중' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '승인됨' },
      'site-visit-pending': { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: '현장방문대기' },
      'site-visit-completed': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: '현장방문완료' },
      bidding: { color: 'bg-orange-100 text-orange-800', icon: Clock, text: '입찰중' },
      'quote-submitted': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: '견적제출완료' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '완료됨' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: '취소됨' }
    }
    
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getAvailableStatuses = (currentStatus: string) => {
    const statusFlow = {
      'pending': ['approved', 'cancelled'],
      'approved': ['site-visit-pending', 'cancelled'],
      'site-visit-pending': ['site-visit-completed', 'cancelled'],
      'site-visit-completed': ['bidding', 'cancelled'],
      'bidding': ['quote-submitted', 'cancelled'],
      'quote-submitted': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': ['approved']
    }
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || []
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      'pending': '대기중',
      'approved': '승인됨',
      'site-visit-pending': '현장방문대기',
      'site-visit-completed': '현장방문완료',
      'bidding': '입찰중',
      'quote-submitted': '견적제출완료',
      'completed': '완료됨',
      'cancelled': '취소됨'
    }
    
    return statusTexts[status as keyof typeof statusTexts] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 값 변환 맵
  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': '단독주택',
    'condo': '콘도',
    'townhouse': '타운하우스',
    'commercial': '상업공간'
  }

  const projectTypeMap: { [key: string]: string } = {
    'bathroom': '욕실',
    'kitchen': '주방',
    'flooring': '바닥',
    'painting': '페인팅',
    'basement': '지하실',
    'full-renovation': '전체 리노베이션'
  }

  const budgetMap: { [key: string]: string } = {
    'under-50000': '5만불 이하',
    '50000-100000': '5-10만불',
    '100000-200000': '10-20만불',
    'over-200000': '20만불 이상'
  }

  const timelineMap: { [key: string]: string } = {
    'immediate': '즉시',
    '1-3months': '1-3개월',
    '3-6months': '3-6개월',
    'over-6months': '6개월 이상'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                관리자 대시보드
              </button>
              <h1 className="text-xl font-semibold text-gray-900">프로젝트 관리</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="주소, 공간 유형, 예산 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({projects.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인됨 ({projects.filter(p => p.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('site-visit-pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'site-visit-pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                현장방문대기 ({projects.filter(p => p.status === 'site-visit-pending').length})
              </button>
              <button
                onClick={() => setFilter('site-visit-completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'site-visit-completed' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                현장방문완료 ({projects.filter(p => p.status === 'site-visit-completed').length})
              </button>
              <button
                onClick={() => setFilter('bidding')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'bidding' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                입찰중 ({projects.filter(p => p.status === 'bidding').length})
              </button>
              <button
                onClick={() => setFilter('quote-submitted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'quote-submitted' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                견적제출완료 ({projects.filter(p => p.status === 'quote-submitted').length})
              </button>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    공간/서비스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예산/일정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 min-h-24">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {project.customer_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {spaceTypeMap[project.space_type] || project.space_type}
                          </div>
                          <div className="text-xs text-gray-600">
                            {project.project_types?.map(type => 
                              projectTypeMap[type] || type
                            ).join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm text-gray-900">
                          <div>{project.full_address}</div>
                          <div className="text-xs text-gray-600">{project.postal_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {budgetMap[project.budget] || project.budget}
                          </div>
                          <div className="text-xs text-gray-600">
                            {timelineMap[project.timeline] || project.timeline}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        {(() => {
                          // 상태가 없거나 null인 경우 기본값 설정
                          const currentStatus = project.status || 'pending'
                          const statusInfo = getStatusColor(currentStatus)
                          const IconComponent = statusInfo.icon
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <IconComponent className="w-3 h-3 mr-1" />
                              {statusInfo.text}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(project.created_at).toLocaleDateString('ko-KR')}
                        </div>
                        {project.visit_date && (
                          <div className="text-xs text-blue-600">
                            방문: {new Date(project.visit_date).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-center relative">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                          >
                            상세
                          </button>
                          
                          {/* 상태 변경 버튼 */}
                          <button
                            onClick={() => openStatusModal(project)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                          >
                            상태변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      프로젝트가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 프로젝트 상세 모달 */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">프로젝트 상세 정보</h2>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">고객 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">고객 ID:</span> {selectedProject.customer_id}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">프로젝트 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">공간 유형:</span> {spaceTypeMap[selectedProject.space_type] || selectedProject.space_type}</p>
                      <p className="text-sm"><span className="font-medium">서비스 유형:</span> {selectedProject.project_types?.map(type => projectTypeMap[type] || type).join(', ')}</p>
                      <p className="text-sm"><span className="font-medium">예산:</span> {budgetMap[selectedProject.budget] || selectedProject.budget}</p>
                      <p className="text-sm"><span className="font-medium">일정:</span> {timelineMap[selectedProject.timeline] || selectedProject.timeline}</p>
                      <p className="text-sm"><span className="font-medium">방문 희망일:</span> {selectedProject.visit_date ? new Date(selectedProject.visit_date).toLocaleDateString('ko-KR') : '미정'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">위치 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">주소:</span> {selectedProject.full_address}</p>
                      <p className="text-sm"><span className="font-medium">우편번호:</span> {selectedProject.postal_code}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">상세 설명</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedProject.description || '없음'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {(() => {
                        // 상태가 없거나 null인 경우 기본값 설정
                        const currentStatus = selectedProject.status || 'pending'
                        const statusInfo = getStatusColor(currentStatus)
                        const IconComponent = statusInfo.icon
                        return (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            <IconComponent className="w-4 h-4 mr-2" />
                            {statusInfo.text}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="mt-6 flex space-x-3">
                  <div className="flex-1">
                    <button
                      onClick={() => openStatusModal(selectedProject)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                    >
                      상태변경
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && selectedProjectForStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    프로젝트 상태 변경
                  </h3>
                  <button
                    onClick={closeStatusModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">프로젝트 정보:</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {spaceTypeMap[selectedProjectForStatus.space_type] || selectedProjectForStatus.space_type}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedProjectForStatus.full_address}
                    </p>
                    <p className="text-xs text-gray-600">
                      현재 상태: {getStatusText(selectedProjectForStatus.status || 'pending')}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-900 mb-3">변경할 상태를 선택하세요:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {getAvailableStatuses(selectedProjectForStatus.status || 'pending').map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (confirm(`상태를 "${getStatusText(status)}"로 변경하시겠습니까?`)) {
                            updateProjectStatus(selectedProjectForStatus.id, status)
                            closeStatusModal()
                          }
                        }}
                        className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          status === 'site-visit-pending' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                          status === 'site-visit-completed' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                          status === 'bidding' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                          status === 'quote-submitted' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' :
                          status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                          'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {getStatusText(status)}
                      </button>
                    ))}
                  </div>
                  {getAvailableStatuses(selectedProjectForStatus.status || 'pending').length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
                      변경 가능한 상태가 없습니다
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeStatusModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
