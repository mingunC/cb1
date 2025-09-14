'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin, Star, Calendar, FileText } from 'lucide-react'

interface Contractor {
  id: string
  user_id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  license_number: string | null
  insurance_info: string | null
  specialties: string[]
  years_experience: number
  portfolio_count: number
  rating: number
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

interface Portfolio {
  id: string
  contractor_id: string
  title: string
  description: string | null
  project_type: string
  space_type: string
  budget_range: string | null
  completion_date: string | null
  photos: any[]
  thumbnail_url: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

export default function ContractorManagementPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<'contractors' | 'portfolios'>('contractors')
  const [filter, setFilter] = useState<string>('all')
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const router = useRouter()

  // 모든 테이블 조회에 에러 처리 추가
  const safeQuery = async (query: Promise<any>) => {
    try {
      const result = await query
      console.log('Query result:', result)
      return result.data || []
    } catch (error) {
      console.error('Query error:', error)
      alert(`데이터베이스 조회 오류: ${error.message}`)
      return []
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // 관리자 권한 확인 - 이메일 기반으로 확인
        if (user.email !== 'cmgg919@gmail.com') {
          router.push('/')
          return
        }
        
        setIsAuthorized(true)
        await fetchData()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Starting fetchData...')
      const supabase = createBrowserClient()
      
      // 업체 목록 조회 - safeQuery 사용
      console.log('Fetching contractors...')
      const contractorsData = await safeQuery(
        supabase
          .from('contractors')
          .select(`
            id,
            user_id,
            company_name,
            contact_name,
            email,
            phone,
            address,
            license_number,
            insurance_info,
            specialties,
            years_experience,
            portfolio_count,
            rating,
            status,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
      )
      console.log('Contractors data:', contractorsData)
      setContractors(contractorsData)

      // 포트폴리오 목록 조회 - safeQuery 사용
      console.log('Fetching portfolios...')
      const portfoliosData = await safeQuery(
        supabase
          .from('portfolios')
          .select(`
            id,
            contractor_id,
            title,
            description,
            project_type,
            space_type,
            budget_range,
            completion_date,
            photos,
            thumbnail_url,
            is_featured,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
      )
      console.log('Portfolios data:', portfoliosData)
      setPortfolios(portfoliosData)
      console.log('FetchData completed successfully')
    } catch (error) {
      console.error('Error in fetchData:', error)
      alert(`데이터 로딩 오류: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updateContractorStatus = async (contractorId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      const result = await safeQuery(
        supabase
          .from('contractors')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', contractorId)
          .select()
      )
      
      if (result.length === 0) {
        alert('상태 업데이트에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      setContractors(contractors.map(contractor => 
        contractor.id === contractorId 
          ? { ...contractor, status: newStatus as any, updated_at: new Date().toISOString() }
          : contractor
      ))

      if (selectedContractor && selectedContractor.id === contractorId) {
        setSelectedContractor({
          ...selectedContractor,
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
      }

      alert(`업체 상태가 "${newStatus}"으로 업데이트되었습니다.`)
    } catch (error) {
      console.error('Error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const updatePortfolioFeatured = async (portfolioId: string, isFeatured: boolean) => {
    try {
      const supabase = createBrowserClient()
      
      const result = await safeQuery(
        supabase
          .from('portfolios')
          .update({ 
            is_featured: isFeatured,
            updated_at: new Date().toISOString()
          })
          .eq('id', portfolioId)
          .select()
      )
      
      if (result.length === 0) {
        alert('포트폴리오 업데이트에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      setPortfolios(portfolios.map(portfolio => 
        portfolio.id === portfolioId 
          ? { ...portfolio, is_featured: isFeatured, updated_at: new Date().toISOString() }
          : portfolio
      ))

      if (selectedPortfolio && selectedPortfolio.id === portfolioId) {
        setSelectedPortfolio({
          ...selectedPortfolio,
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
      }

      alert(`포트폴리오가 ${isFeatured ? '추천' : '일반'}으로 업데이트되었습니다.`)
    } catch (error) {
      console.error('Error:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '활성' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: '비활성' },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle, text: '정지됨' }
    }
    
    return badges[status as keyof typeof badges] || badges.active
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredContractors = contractors.filter(contractor => {
    if (filter === 'all') return true
    if (filter === 'pending') return contractor.status === 'inactive'
    if (filter === 'approved') return contractor.status === 'active'
    if (filter === 'rejected') return contractor.status === 'suspended'
    return contractor.status === filter
  })

  const filteredPortfolios = portfolios.filter(portfolio => {
    if (filter === 'all') return true
    if (filter === 'featured') return portfolio.is_featured
    if (filter === 'regular') return !portfolio.is_featured
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">업체 관리를 불러오는 중...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">업체 관리</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 업체 수</h3>
            <p className="text-3xl font-bold text-blue-600">{contractors.length}</p>
            <p className="text-sm text-gray-600">등록된 업체</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">비활성 업체</h3>
            <p className="text-3xl font-bold text-yellow-600">{contractors.filter(c => c.status === 'inactive').length}</p>
            <p className="text-sm text-gray-600">검토 필요</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">활성 업체</h3>
            <p className="text-3xl font-bold text-green-600">{contractors.filter(c => c.status === 'active').length}</p>
            <p className="text-sm text-gray-600">승인된 업체</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">포트폴리오</h3>
            <p className="text-3xl font-bold text-purple-600">{portfolios.length}</p>
            <p className="text-sm text-gray-600">총 포트폴리오</p>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('contractors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contractors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                업체 관리 ({contractors.length})
              </button>
              <button
                onClick={() => setActiveTab('portfolios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                포트폴리오 관리 ({portfolios.length})
              </button>
            </nav>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              대기중 ({contractors.filter(c => c.status === 'inactive').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              승인됨 ({contractors.filter(c => c.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              정지됨 ({contractors.filter(c => c.status === 'suspended').length})
            </button>
            {activeTab === 'portfolios' && (
              <>
                <button
                  onClick={() => setFilter('featured')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'featured' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  추천 ({portfolios.filter(p => p.is_featured).length})
                </button>
                <button
                  onClick={() => setFilter('regular')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'regular' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  일반 ({portfolios.filter(p => !p.is_featured).length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* 업체 목록 */}
        {activeTab === 'contractors' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전문분야
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경력/평점
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContractors.length > 0 ? (
                    filteredContractors.map((contractor) => (
                      <tr key={contractor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{contractor.company_name}</div>
                            <div className="text-xs text-gray-600">{contractor.email}</div>
                            {contractor.license_number && (
                              <div className="text-xs text-gray-500">라이센스: {contractor.license_number}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {contractor.phone || '-'}
                            </div>
                            {contractor.address && (
                              <div className="text-xs text-gray-600 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contractor.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  {contractor.address}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {contractor.specialties?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {contractor.specialties.slice(0, 2).map((specialty, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {specialty}
                                  </span>
                                ))}
                                {contractor.specialties.length > 2 && (
                                  <span className="text-xs text-gray-500">+{contractor.specialties.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {contractor.years_experience || 0}년
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1 text-yellow-400" />
                              {contractor.rating || 0}/5 ({contractor.portfolio_count || 0}건)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const statusInfo = getStatusColor(contractor.status)
                            const IconComponent = statusInfo.icon
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <IconComponent className="w-3 h-3 mr-1" />
                                {statusInfo.text}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(contractor.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedContractor(contractor)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              상세
                            </button>
                            {contractor.status === 'inactive' && (
                              <>
                                <button
                                  onClick={() => {
                                    if (confirm('이 업체를 활성화하시겠습니까?')) {
                                      updateContractorStatus(contractor.id, 'active')
                                    }
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  활성화
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('이 업체를 정지하시겠습니까?')) {
                                      updateContractorStatus(contractor.id, 'suspended')
                                    }
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  정지
                                </button>
                              </>
                            )}
                            {contractor.status === 'active' && (
                              <button
                                onClick={() => {
                                  if (confirm('이 업체를 비활성화하시겠습니까?')) {
                                    updateContractorStatus(contractor.id, 'inactive')
                                  }
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                              >
                                비활성화
                              </button>
                            )}
                            {contractor.status === 'suspended' && (
                              <button
                                onClick={() => {
                                  if (confirm('이 업체를 활성화하시겠습니까?')) {
                                    updateContractorStatus(contractor.id, 'active')
                                  }
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                              >
                                활성화
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        업체가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 포트폴리오 목록 */}
        {activeTab === 'portfolios' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프로젝트 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예산/완료일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이미지
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      추천여부
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPortfolios.length > 0 ? (
                    filteredPortfolios.map((portfolio) => (
                      <tr key={portfolio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{portfolio.title}</div>
                            <div className="text-xs text-gray-600">{portfolio.project_type}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {portfolio.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {contractors.find(c => c.id === portfolio.contractor_id)?.company_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div>{portfolio.budget_range || '-'}</div>
                            <div className="text-xs text-gray-600">{portfolio.completion_date || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {portfolio.photos?.length || 0}개
                            </div>
                            {portfolio.thumbnail_url && (
                              <div className="text-xs text-gray-500">썸네일 있음</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {portfolio.is_featured ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              추천
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              일반
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(portfolio.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedPortfolio(portfolio)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              상세
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`이 포트폴리오를 ${portfolio.is_featured ? '일반' : '추천'}으로 변경하시겠습니까?`)) {
                                  updatePortfolioFeatured(portfolio.id, !portfolio.is_featured)
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs ${
                                portfolio.is_featured 
                                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              }`}
                            >
                              {portfolio.is_featured ? '일반으로' : '추천으로'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        포트폴리오가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 업체 상세 모달 */}
        {selectedContractor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">업체 상세 정보</h2>
                  <button
                    onClick={() => setSelectedContractor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">기본 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">회사명:</span> {selectedContractor.company_name}</p>
                      <p className="text-sm"><span className="font-medium">담당자:</span> {selectedContractor.contact_name || '-'}</p>
                      <p className="text-sm"><span className="font-medium">이메일:</span> {selectedContractor.email || '-'}</p>
                      <p className="text-sm"><span className="font-medium">전화번호:</span> {selectedContractor.phone || '-'}</p>
                      <p className="text-sm"><span className="font-medium">라이센스 번호:</span> {selectedContractor.license_number || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">주소 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {selectedContractor.address ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedContractor.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {selectedContractor.address}
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">등록된 주소가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">전문 분야</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {selectedContractor.specialties?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedContractor.specialties.map((specialty, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">등록된 전문 분야가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">경력 및 평점</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">경력:</span> {selectedContractor.years_experience || 0}년</p>
                      <p className="text-sm"><span className="font-medium">평점:</span> {selectedContractor.rating || 0}/5</p>
                      <p className="text-sm"><span className="font-medium">포트폴리오:</span> {selectedContractor.portfolio_count || 0}건</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {(() => {
                        const statusInfo = getStatusColor(selectedContractor.status)
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

                <div className="mt-6 flex space-x-3">
                  {selectedContractor.status === 'inactive' && (
                    <>
                      <button
                        onClick={() => {
                          updateContractorStatus(selectedContractor.id, 'active')
                          setSelectedContractor(null)
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        활성화하기
                      </button>
                      <button
                        onClick={() => {
                          updateContractorStatus(selectedContractor.id, 'suspended')
                          setSelectedContractor(null)
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        정지하기
                      </button>
                    </>
                  )}
                  {selectedContractor.status === 'active' && (
                    <button
                      onClick={() => {
                        updateContractorStatus(selectedContractor.id, 'inactive')
                        setSelectedContractor(null)
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      비활성화하기
                    </button>
                  )}
                  {selectedContractor.status === 'suspended' && (
                    <button
                      onClick={() => {
                        updateContractorStatus(selectedContractor.id, 'active')
                        setSelectedContractor(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      활성화하기
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedContractor(null)}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 포트폴리오 상세 모달 */}
        {selectedPortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">포트폴리오 상세 정보</h2>
                  <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">프로젝트 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">제목:</span> {selectedPortfolio.title}</p>
                      <p className="text-sm"><span className="font-medium">프로젝트 유형:</span> {selectedPortfolio.project_type}</p>
                      <p className="text-sm"><span className="font-medium">공간 유형:</span> {selectedPortfolio.space_type}</p>
                      <p className="text-sm"><span className="font-medium">예산 범위:</span> {selectedPortfolio.budget_range || '-'}</p>
                      <p className="text-sm"><span className="font-medium">완료일:</span> {selectedPortfolio.completion_date || '-'}</p>
                      <p className="text-sm"><span className="font-medium">추천 여부:</span> {selectedPortfolio.is_featured ? '추천됨' : '일반'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">프로젝트 설명</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedPortfolio.description || '없음'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">업체 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">업체:</span> {contractors.find(c => c.id === selectedPortfolio.contractor_id)?.company_name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">추천 상태</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {selectedPortfolio.is_featured ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-4 h-4 mr-2" />
                          추천됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          일반
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      updatePortfolioFeatured(selectedPortfolio.id, !selectedPortfolio.is_featured)
                      setSelectedPortfolio(null)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPortfolio.is_featured 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    {selectedPortfolio.is_featured ? '일반으로 변경' : '추천으로 변경'}
                  </button>
                  <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    닫기
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
