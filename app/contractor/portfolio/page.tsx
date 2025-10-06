'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Plus, Eye, Edit, Trash2, Upload, Image, Calendar, DollarSign, Clock, Star, CheckCircle, XCircle } from 'lucide-react'

interface Portfolio {
  id: string
  contractor_id: string
  title: string
  description: string
  project_type: string
  budget_range: string
  duration: string
  images: string[]
  before_images: string[]
  after_images: string[]
  is_featured: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function PortfolioManagementPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    budget_range: '',
    duration: '',
    project_address: '',
    images: [] as File[],
    before_images: [] as File[],
    after_images: [] as File[]
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // 업체 권한 확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (userError || !userData || userData.user_type !== 'contractor') {
          router.push('/')
          return
        }
        
        setIsAuthorized(true)
        await fetchPortfolios()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('contractor_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching portfolios:', error)
        } else {
          setPortfolios(data || [])
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImages = async (files: File[], folder: string) => {
    const supabase = createBrowserClient()
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Image upload error:', uploadError)
        throw new Error(`이미지 업로드 실패: ${file.name}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(fileName)
      
      uploadedUrls.push(publicUrl)
    }
    
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.project_type || !formData.budget_range || !formData.duration) {
      alert('모든 필수 필드를 입력해주세요.')
      return
    }

    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }

      // 이미지 업로드
      let images: string[] = []
      let beforeImages: string[] = []
      let afterImages: string[] = []

      if (formData.images.length > 0) {
        images = await uploadImages(formData.images, 'project')
      }
      if (formData.before_images.length > 0) {
        beforeImages = await uploadImages(formData.before_images, 'before')
      }
      if (formData.after_images.length > 0) {
        afterImages = await uploadImages(formData.after_images, 'after')
      }

      // 포트폴리오 저장
      const { error } = await supabase
        .from('portfolios')
        .insert({
          contractor_id: user.id,
          title: formData.title,
          description: formData.description,
          project_type: formData.project_type,
          budget_range: formData.budget_range,
          duration: formData.duration,
          project_address: formData.project_address,
          images: images,
          before_images: beforeImages,
          after_images: afterImages,
          status: 'pending'
        })

      if (error) {
        console.error('Portfolio creation error:', error)
        alert('포트폴리오 생성에 실패했습니다.')
        return
      }

      alert('포트폴리오가 성공적으로 생성되었습니다!')
      setShowAddModal(false)
      setFormData({
        title: '',
        description: '',
        project_type: '',
        budget_range: '',
        duration: '',
        images: [],
        before_images: [],
        after_images: []
      })
      await fetchPortfolios()
    } catch (error) {
      console.error('Error:', error)
      alert('포트폴리오 생성 중 오류가 발생했습니다.')
    }
  }

  const deletePortfolio = async (portfolioId: string) => {
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?')) {
      return
    }

    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId)
      
      if (error) {
        console.error('Error deleting portfolio:', error)
        alert('포트폴리오 삭제에 실패했습니다.')
        return
      }

      alert('포트폴리오가 삭제되었습니다.')
      await fetchPortfolios()
    } catch (error) {
      console.error('Error:', error)
      alert('포트폴리오 삭제 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '검토중' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '승인됨' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: '거절됨' }
    }
    
    return badges[status as keyof typeof badges] || badges.pending
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const projectTypes = [
    '주방 리노베이션',
    '욕실 리노베이션',
    '바닥 교체',
    '페인팅',
    '지하실 리노베이션',
    '전체 리노베이션',
    '외부 리노베이션',
    '기타'
  ]

  const budgetRanges = [
    '5만불 이하',
    '5-10만불',
    '10-20만불',
    '20-50만불',
    '50만불 이상'
  ]

  const durations = [
    '1주 이하',
    '1-2주',
    '2-4주',
    '1-2개월',
    '2-3개월',
    '3개월 이상'
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">업체 권한이 필요합니다.</p>
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
                onClick={() => router.push('/contractor')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                업체 대시보드
              </button>
              <h1 className="text-xl font-semibold text-gray-900">포트폴리오 관리</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 포트폴리오
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 포트폴리오</h3>
            <p className="text-3xl font-bold text-blue-600">{portfolios.length}</p>
            <p className="text-sm text-gray-600">등록된 프로젝트</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">승인됨</h3>
            <p className="text-3xl font-bold text-green-600">{portfolios.filter(p => p.status === 'approved').length}</p>
            <p className="text-sm text-gray-600">공개된 프로젝트</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검토중</h3>
            <p className="text-3xl font-bold text-yellow-600">{portfolios.filter(p => p.status === 'pending').length}</p>
            <p className="text-sm text-gray-600">승인 대기</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">거절됨</h3>
            <p className="text-3xl font-bold text-red-600">{portfolios.filter(p => p.status === 'rejected').length}</p>
            <p className="text-sm text-gray-600">수정 필요</p>
          </div>
        </div>

        {/* 포트폴리오 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예산/기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
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
                {portfolios.length > 0 ? (
                  portfolios.map((portfolio) => (
                    <tr key={portfolio.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{portfolio.title}</div>
                          <div className="text-xs text-gray-600">{portfolio.project_type}</div>
                          {portfolio.project_address && (
                            <div className="text-xs text-gray-500 mt-1">
                              📍 {portfolio.project_address}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {portfolio.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {portfolio.budget_range}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {portfolio.duration}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Image className="h-3 w-3 mr-1" />
                            {portfolio.images?.length || 0}개
                          </div>
                          {portfolio.is_featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              추천
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusInfo = getStatusColor(portfolio.status)
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
                          {formatDate(portfolio.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedPortfolio(portfolio)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deletePortfolio(portfolio.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      포트폴리오가 없습니다. 새 포트폴리오를 추가해보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 포트폴리오 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">새 포트폴리오 추가</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 제목 *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="예: 모던 주방 리노베이션"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 설명 *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="프로젝트에 대한 상세 설명을 입력해주세요..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 유형 *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    >
                      <option value="">선택하세요</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예산 범위 *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.budget_range}
                        onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      >
                        <option value="">선택하세요</option>
                        {budgetRanges.map((range) => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        소요 기간 *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      >
                        <option value="">선택하세요</option>
                        {durations.map((duration) => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 주소
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.project_address}
                      onChange={(e) => setFormData({ ...formData, project_address: e.target.value })}
                      placeholder="예: 서울시 강남구 테헤란로 123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로젝트 이미지
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setFormData({ ...formData, images: Array.from(e.target.files || []) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">프로젝트 완성 이미지를 업로드하세요.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사전 이미지
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setFormData({ ...formData, before_images: Array.from(e.target.files || []) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">작업 전 이미지를 업로드하세요.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사후 이미지
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setFormData({ ...formData, after_images: Array.from(e.target.files || []) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">작업 후 이미지를 업로드하세요.</p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      포트폴리오 생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
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
                  <h2 className="text-xl font-semibold text-gray-900">포트폴리오 상세</h2>
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
                      <p className="text-sm"><span className="font-medium">유형:</span> {selectedPortfolio.project_type}</p>
                      <p className="text-sm"><span className="font-medium">예산:</span> {selectedPortfolio.budget_range}</p>
                      <p className="text-sm"><span className="font-medium">기간:</span> {selectedPortfolio.duration}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">프로젝트 설명</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedPortfolio.description}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">이미지 정보</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm"><span className="font-medium">프로젝트 이미지:</span> {selectedPortfolio.images?.length || 0}개</p>
                      <p className="text-sm"><span className="font-medium">사전 이미지:</span> {selectedPortfolio.before_images?.length || 0}개</p>
                      <p className="text-sm"><span className="font-medium">사후 이미지:</span> {selectedPortfolio.after_images?.length || 0}개</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      {(() => {
                        const statusInfo = getStatusColor(selectedPortfolio.status)
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

                <div className="mt-6 flex justify-end">
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
