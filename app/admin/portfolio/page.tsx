'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Upload,
  X,
  Save,
  Calendar,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PortfolioProject {
  id: string
  contractor_id: string
  title: string
  description: string | null
  images: string[] | null
  category: string
  year: string
  project_address: string | null
  created_at: string
  updated_at: string
  contractors: {
    company_name: string
    contact_name: string | null
  }
}

interface Contractor {
  id: string
  company_name: string
  contact_name: string | null
}

export default function AdminPortfolioPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedContractor, setSelectedContractor] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  
  const router = useRouter()

  const categories = ['all', '주거공간', '상업공간']

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
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

      setUser(user)
      setIsAuthorized(true)
      setIsLoading(false)
      
      await Promise.all([
        fetchProjects(),
        fetchContractors()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  const fetchProjects = async () => {
    try {
      const supabase = createBrowserClient()
      
      // 포트폴리오와 업체 정보를 별도로 조회
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })

      if (portfoliosError) {
        console.error('Error fetching portfolios:', portfoliosError)
        toast.error('포트폴리오를 불러오는데 실패했습니다.')
        return
      }

      // 업체 정보 조회
      const { data: contractors, error: contractorsError } = await supabase
        .from('contractors')
        .select('id, company_name, contact_name')

      if (contractorsError) {
        console.error('Error fetching contractors:', contractorsError)
        toast.error('업체 정보를 불러오는데 실패했습니다.')
        return
      }

      // 포트폴리오와 업체 정보 결합
      const projectsWithContractors = portfolios?.map(portfolio => ({
        ...portfolio,
        contractors: contractors?.find(c => c.id === portfolio.contractor_id) || null
      })) || []

      setProjects(projectsWithContractors)
    } catch (error) {
      console.error('Error:', error)
      toast.error('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  const fetchContractors = async () => {
    try {
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('contractors')
        .select('id, company_name, contact_name')
        .order('company_name')

      if (error) {
        console.error('Error fetching contractors:', error)
        return
      }

      setContractors(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const openCreateModal = () => {
    setEditingProject(null)
    setUploadedImageUrl(null)
    setIsModalOpen(true)
  }

  const openEditModal = (project: PortfolioProject) => {
    setEditingProject(project)
    setUploadedImageUrl(project.images && project.images.length > 0 ? project.images[0] : null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
    setUploadedImageUrl(null)
  }

  const handleImageUpload = async (file: File) => {
    try {
      const supabase = createBrowserClient()
      
      // 파일명 생성
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `portfolio-images/${fileName}`

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('이미지 업로드에 실패했습니다.')
        return
      }

      // 공개 URL 생성
      const { data } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath)

      setUploadedImageUrl(data.publicUrl)
      toast.success('이미지가 업로드되었습니다.')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createBrowserClient()

      const projectData = {
        contractor_id: formData.get('contractor_id') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        images: uploadedImageUrl ? [uploadedImageUrl] : [],
        category: formData.get('category') as string,
        year: formData.get('year') as string,
      }

      if (editingProject) {
        // 수정
        const { error } = await supabase
          .from('portfolios')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) {
          console.error('Update error:', error)
          toast.error('프로젝트 수정에 실패했습니다.')
          return
        }

        toast.success('프로젝트가 수정되었습니다.')
      } else {
        // 생성
        const { error } = await supabase
          .from('portfolios')
          .insert([projectData])

        if (error) {
          console.error('Insert error:', error)
          toast.error('프로젝트 생성에 실패했습니다.')
          return
        }

        toast.success('프로젝트가 생성되었습니다.')
      }

      closeModal()
      await fetchProjects()
    } catch (error) {
      console.error('Error:', error)
      toast.error('작업 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      return
    }

    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Delete error:', error)
        toast.error('프로젝트 삭제에 실패했습니다.')
        return
      }

      toast.success('프로젝트가 삭제되었습니다.')
      await fetchProjects()
    } catch (error) {
      console.error('Error:', error)
      toast.error('프로젝트 삭제 중 오류가 발생했습니다.')
    }
  }

  // 필터링된 프로젝트
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.contractors.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory
    const matchesContractor = selectedContractor === 'all' || project.contractor_id === selectedContractor
    
    return matchesSearch && matchesCategory && matchesContractor
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">관리자 권한 확인 중...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">포트폴리오 관리</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">포트폴리오 관리</h2>
            <p className="text-gray-600">업체 포트폴리오를 관리하고 검증하세요</p>
          </div>
          {!isModalOpen && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              새 프로젝트 추가
            </button>
          )}
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="프로젝트명, 설명, 업체명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? '모든 카테고리' : category}
                  </option>
                ))}
              </select>

              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 업체</option>
                {contractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.company_name}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
              <p className="text-gray-500">새 프로젝트를 추가하거나 검색 조건을 변경해보세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openEditModal(project)}
                >
                  <div className="flex items-start space-x-4">
                    {/* 이미지 */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                      {project.images && project.images.length > 0 ? (
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {project.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {project.description || '설명이 없습니다.'}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              <span>{project.contractors.company_name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium mr-1">카테고리:</span>
                              <span>{project.category}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{project.year}</span>
                            </div>
                          </div>
                          {project.project_address && (
                            <div className="text-sm text-gray-500 mt-2">
                              📍 {project.project_address}
                            </div>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(project)
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(project.id)
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProject ? '프로젝트 수정' : '새 프로젝트 추가'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 업체 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업체 선택 *
                </label>
                <select
                  name="contractor_id"
                  required
                  defaultValue={editingProject?.contractor_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">업체를 선택하세요</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingProject?.title || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="프로젝트 제목을 입력하세요"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 설명
                </label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={editingProject?.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="프로젝트 설명을 입력하세요"
                />
              </div>

              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 주소
                </label>
                <input
                  type="text"
                  name="project_address"
                  defaultValue={editingProject?.project_address || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 이미지
                </label>
                <div className="space-y-4">
                  {uploadedImageUrl && (
                    <div className="relative">
                      <img
                        src={uploadedImageUrl}
                        alt="업로드된 이미지"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedImageUrl(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">이미지를 업로드하세요</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block"
                    >
                      파일 선택
                    </label>
                  </div>
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  name="category"
                  required
                  defaultValue={editingProject?.category || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">카테고리를 선택하세요</option>
                  <option value="주거공간">주거공간</option>
                  <option value="상업공간">상업공간</option>
                </select>
              </div>

              {/* 연도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  완료 연도 *
                </label>
                <input
                  type="text"
                  name="year"
                  required
                  defaultValue={editingProject?.year || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 2024"
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingProject ? '수정' : '생성'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
