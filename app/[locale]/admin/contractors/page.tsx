'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin, Star, Calendar, FileText, Plus, Trash2, X, Globe } from 'lucide-react'

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
  year: string | null
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<Contractor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  const router = useRouter()

  // 새 업체 입력 폼 상태
  const [newContractor, setNewContractor] = useState({
    email: '',
    password: '',
    company_name: '',
    contact_name: '',
    phone: '',
    address: '',
    specialties: [] as string[],
    preferred_languages: ['en'] as string[]
  })

  // 전문 분야 옵션
  const specialtyOptions = [
    { value: 'residential', label: 'Residential (주거)' },
    { value: 'commercial', label: 'Commercial (상업)' }
  ]

  // 언어 옵션
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ko', label: '한국어 (Korean)' }
  ]

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setNewContractor({
        ...newContractor,
        specialties: [...newContractor.specialties, specialty]
      })
    } else {
      setNewContractor({
        ...newContractor,
        specialties: newContractor.specialties.filter(s => s !== specialty)
      })
    }
  }

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setNewContractor({
        ...newContractor,
        preferred_languages: [...newContractor.preferred_languages, language]
      })
    } else {
      setNewContractor({
        ...newContractor,
        preferred_languages: newContractor.preferred_languages.filter(l => l !== language)
      })
    }
  }

  const safeQuery = async (queryBuilder: any) => {
    try {
      const result = await queryBuilder
      if (result.error) throw new Error(result.error.message)
      return result.data || []
    } catch (error) {
      console.error('Query error:', error)
      alert(`데이터베이스 조회 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
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

        if (user.email !== 'cmgg919@gmail.com') {
          router.push('/')
          return
        }
        
        // 세션에서 액세스 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          setAccessToken(session.access_token)
          console.log('✅ Access token obtained')
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
      const supabase = createBrowserClient()
      
      const contractorsData = await safeQuery(
        supabase.from('contractors').select('*').order('created_at', { ascending: false })
      )
      setContractors(contractorsData)

      const portfoliosData = await safeQuery(
        supabase.from('portfolios').select('*').order('created_at', { ascending: false })
      )
      
      const transformedPortfolios = (portfoliosData || []).map((p: any) => ({
        id: p.id,
        contractor_id: p.contractor_id,
        title: p.title || '제목 없음',
        description: p.description,
        project_type: p.category || '리노베이션',
        space_type: '주거공간',
        budget_range: null,
        year: p.year,
        photos: p.images || [],
        thumbnail_url: p.images?.[0] || null,
        is_featured: false,
        created_at: p.created_at,
        updated_at: p.created_at
      }))
      
      setPortfolios(transformedPortfolios)
    } catch (error) {
      console.error('Error in fetchData:', error)
      alert(`데이터 로딩 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 업체 추가 시작')
    
    if (!accessToken) {
      alert('인증 토큰이 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    // 전문 분야 필수 체크
    if (newContractor.specialties.length === 0) {
      alert('전문 분야를 최소 1개 이상 선택해주세요.')
      return
    }

    // 언어 필수 체크
    if (newContractor.preferred_languages.length === 0) {
      alert('선호 언어를 최소 1개 이상 선택해주세요.')
      return
    }
    
    setIsSubmitting(true)

    try {
      console.log('📤 API 호출 (Authorization 헤더 포함)')
      
      const response = await fetch('/api/admin/contractors/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newContractor),
      })

      console.log('📥 응답 상태:', response.status)
      
      const result = await response.json()
      console.log('📥 응답 데이터:', result)

      if (!response.ok) {
        throw new Error(result.error || '업체 추가에 실패했습니다.')
      }

      alert(result.message || '업체가 성공적으로 추가되었습니다.')
      setShowCreateModal(false)
      setNewContractor({
        email: '',
        password: '',
        company_name: '',
        contact_name: '',
        phone: '',
        address: '',
        specialties: [],
        preferred_languages: ['en']
      })
      
      await fetchData()
    } catch (error) {
      console.error('❌ 에러:', error)
      alert(error instanceof Error ? error.message : '업체 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContractor = async () => {
    if (!showDeleteModal) return
    
    if (!accessToken) {
      alert('인증 토큰이 없습니다. 페이지를 새로고침해주세요.')
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/contractors/delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          contractor_id: showDeleteModal.id,
          user_id: showDeleteModal.user_id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '업체 삭제에 실패했습니다.')
      }

      alert(result.message || '업체가 성공적으로 삭제되었습니다.')
      setShowDeleteModal(null)
      
      await fetchData()
    } catch (error) {
      console.error('Delete contractor error:', error)
      alert(error instanceof Error ? error.message : '업체 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateContractorStatus = async (contractorId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      const result = await safeQuery(
        supabase.from('contractors').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', contractorId).select()
      )
      
      if (result.length === 0) {
        alert('상태 업데이트에 실패했습니다.')
        return
      }

      setContractors(contractors.map(contractor => 
        contractor.id === contractorId ? { ...contractor, status: newStatus as any, updated_at: new Date().toISOString() } : contractor
      ))

      if (selectedContractor && selectedContractor.id === contractorId) {
        setSelectedContractor({ ...selectedContractor, status: newStatus as any, updated_at: new Date().toISOString() })
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
        supabase.from('portfolios').update({ is_featured: isFeatured, updated_at: new Date().toISOString() }).eq('id', portfolioId).select()
      )
      
      if (result.length === 0) {
        alert('포트폴리오 업데이트에 실패했습니다.')
        return
      }

      setPortfolios(portfolios.map(portfolio => 
        portfolio.id === portfolioId ? { ...portfolio, is_featured: isFeatured, updated_at: new Date().toISOString() } : portfolio
      ))

      if (selectedPortfolio && selectedPortfolio.id === portfolioId) {
        setSelectedPortfolio({ ...selectedPortfolio, is_featured: isFeatured, updated_at: new Date().toISOString() })
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
    return new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
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

  const getContractorName = (contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId)
    return contractor?.company_name || '알 수 없음'
  }

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
          <button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">홈으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => router.push('/admin')} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />관리자 대시보드
              </button>
              <h1 className="text-xl font-semibold text-gray-900">업체 관리</h1>
            </div>
            {activeTab === 'contractors' && (
              <button onClick={() => setShowCreateModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <Plus className="h-5 w-5 mr-2" />업체 추가
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => { setActiveTab('contractors'); setFilter('all'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'contractors' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            업체 목록 ({contractors.length})
          </button>
          <button
            onClick={() => { setActiveTab('portfolios'); setFilter('all'); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'portfolios' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            포트폴리오 ({portfolios.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {activeTab === 'contractors' ? (
            <>
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                전체
              </button>
              <button onClick={() => setFilter('approved')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                활성
              </button>
              <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                비활성
              </button>
              <button onClick={() => setFilter('rejected')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                정지됨
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                전체
              </button>
              <button onClick={() => setFilter('featured')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'featured' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                추천
              </button>
              <button onClick={() => setFilter('regular')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'regular' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                일반
              </button>
            </>
          )}
        </div>

        {/* Contractors List */}
        {activeTab === 'contractors' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredContractors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                등록된 업체가 없습니다.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContractors.map((contractor) => {
                    const statusBadge = getStatusColor(contractor.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <tr key={contractor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{contractor.company_name}</div>
                          {contractor.specialties && contractor.specialties.length > 0 && (
                            <div className="text-sm text-gray-500">{contractor.specialties.slice(0, 3).join(', ')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {contractor.contact_name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {contractor.email || '-'}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {contractor.phone || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contractor.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedContractor(contractor)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(contractor)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Portfolios List */}
        {activeTab === 'portfolios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm">
                등록된 포트폴리오가 없습니다.
              </div>
            ) : (
              filteredPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    {portfolio.thumbnail_url ? (
                      <img src={portfolio.thumbnail_url} alt={portfolio.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="h-12 w-12" />
                      </div>
                    )}
                    {portfolio.is_featured && (
                      <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                        추천
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{portfolio.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{getContractorName(portfolio.contractor_id)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(portfolio.created_at)}</span>
                      <button
                        onClick={() => updatePortfolioFeatured(portfolio.id, !portfolio.is_featured)}
                        className={`text-xs px-2 py-1 rounded ${
                          portfolio.is_featured 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {portfolio.is_featured ? '추천 해제' : '추천하기'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Contractor Detail Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">업체 상세 정보</h2>
              <button onClick={() => setSelectedContractor(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">업체명</label>
                <p className="text-gray-900">{selectedContractor.company_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">담당자</label>
                  <p className="text-gray-900">{selectedContractor.contact_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                  <p className="text-gray-900">{selectedContractor.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
                  <p className="text-gray-900">{selectedContractor.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">주소</label>
                  <p className="text-gray-900">{selectedContractor.address || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">전문 분야</label>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.specialties?.map((specialty, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {specialty}
                    </span>
                  )) || <span className="text-gray-400">-</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">평점</label>
                  <p className="text-gray-900 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {selectedContractor.rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">경력</label>
                  <p className="text-gray-900">{selectedContractor.years_experience || 0}년</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">포트폴리오</label>
                  <p className="text-gray-900">{selectedContractor.portfolio_count || 0}개</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">상태 변경</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateContractorStatus(selectedContractor.id, 'active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedContractor.status === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    활성화
                  </button>
                  <button
                    onClick={() => updateContractorStatus(selectedContractor.id, 'inactive')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedContractor.status === 'inactive' 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    비활성화
                  </button>
                  <button
                    onClick={() => updateContractorStatus(selectedContractor.id, 'suspended')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedContractor.status === 'suspended' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    정지
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Contractor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">새 업체 추가</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateContractor} className="p-6 space-y-4">
              
              {/* 선호 언어 선택 */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  선호 언어 * (이메일 알림 언어)
                </label>
                <p className="text-xs text-gray-500 mb-3">다중 선택 가능</p>
                <div className="flex flex-wrap gap-4">
                  {languageOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newContractor.preferred_languages.includes(option.value)}
                        onChange={(e) => handleLanguageChange(option.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {newContractor.preferred_languages.length === 0 && (
                  <p className="text-red-500 text-sm mt-2">언어를 선택해주세요</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                  <input
                    type="email"
                    required
                    value={newContractor.email}
                    onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contractor@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                  <input
                    type="password"
                    required
                    value={newContractor.password}
                    onChange={(e) => setNewContractor({ ...newContractor, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8자 이상"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업체명 *</label>
                <input
                  type="text"
                  required
                  value={newContractor.company_name}
                  onChange={(e) => setNewContractor({ ...newContractor, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC Construction"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
                  <input
                    type="text"
                    value={newContractor.contact_name}
                    onChange={(e) => setNewContractor({ ...newContractor, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={newContractor.phone}
                    onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="416-123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={newContractor.address}
                  onChange={(e) => setNewContractor({ ...newContractor, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, Toronto, ON"
                />
              </div>

              {/* 전문 분야 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전문 분야 * (최소 1개 선택)</label>
                <div className="space-y-2">
                  {specialtyOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newContractor.specialties.includes(option.value)}
                        onChange={(e) => handleSpecialtyChange(option.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {newContractor.specialties.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">전문 분야를 선택해주세요</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newContractor.specialties.length === 0 || newContractor.preferred_languages.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '추가 중...' : '업체 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">업체 삭제 확인</h2>
              <p className="text-gray-600 mb-6">
                <span className="font-medium text-gray-900">{showDeleteModal.company_name}</span> 업체를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteContractor}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
