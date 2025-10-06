'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Upload, X, Edit3, Trash2, Image as ImageIcon } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'

interface PortfolioProject {
  id: string
  title: string
  description: string
  images: string[]
  category: string
  year: string
  project_address?: string
}

interface PortfolioManagerProps {
  contractorId: string
  onPortfolioUpdate?: () => void
}

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES = 10

export default function PortfolioManager({ contractorId, onPortfolioUpdate }: PortfolioManagerProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '주거공간',
    year: new Date().getFullYear().toString(),
    project_address: '',
    images: [] as File[]
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    fetchProjects()
  }, [contractorId])

  const fetchProjects = async () => {
    try {
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('포트폴리오 로드 에러:', error)
      } else {
        const transformedData = (data || []).map(p => ({
          ...p,
          images: p.images || []
        }))
        setProjects(transformedData)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    const currentImageCount = formData.images.length + imagePreviews.length
    const remainingSlots = MAX_IMAGES - currentImageCount
    
    if (files.length > remainingSlots) {
      alert(`최대 ${MAX_IMAGES}개의 이미지만 업로드 가능합니다.`)
      return
    }

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    files.forEach(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
        invalidFiles.push(`${file.name} (지원하지 않는 형식)`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (최대 5MB)`)
        return
      }

      validFiles.push(file)
    })

    if (invalidFiles.length > 0) {
      alert('다음 파일들은 업로드할 수 없습니다:\n\n' + invalidFiles.join('\n'))
    }

    if (validFiles.length === 0) return

    const newPreviews: string[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description) {
      alert('제목과 설명을 입력해주세요.')
      return
    }

    if (formData.images.length === 0 && !editingProject) {
      alert('최소 1개 이상의 이미지를 업로드해주세요.')
      return
    }

    setIsUploading(true)

    try {
      const supabase = createBrowserClient()
      const imageUrls: string[] = editingProject?.images || []

      if (formData.images.length > 0) {
        for (const file of formData.images) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${contractorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(fileName, file)

          if (uploadError) {
            console.error('이미지 업로드 에러:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(fileName)

          imageUrls.push(publicUrl)
        }
      }

      if (imageUrls.length === 0) {
        alert('이미지 업로드에 실패했습니다.')
        return
      }

      const portfolioData = {
        contractor_id: contractorId,
        title: formData.title,
        description: formData.description,
        images: imageUrls,
        category: formData.category,
        year: formData.year,
        project_address: formData.project_address || null
      }

      if (editingProject) {
        const { error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('id', editingProject.id)

        if (error) {
          console.error('포트폴리오 수정 에러:', error)
          alert('포트폴리오 수정에 실패했습니다.')
          return
        }
      } else {
        const { error } = await supabase
          .from('portfolios')
          .insert(portfolioData)

        if (error) {
          console.error('포트폴리오 생성 에러:', error)
          alert('포트폴리오 생성에 실패했습니다.')
          return
        }
      }

      alert(editingProject ? '포트폴리오가 수정되었습니다.' : '포트폴리오가 추가되었습니다.')
      await fetchProjects()
      cancelForm()
      onPortfolioUpdate?.()
    } catch (error) {
      console.error('Error:', error)
      alert('포트폴리오 저장에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
      year: project.year,
      project_address: project.project_address || '',
      images: []
    })
    setImagePreviews(project.images || [])
    setShowAddForm(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return

    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('삭제 에러:', error)
        alert('프로젝트 삭제에 실패했습니다.')
        return
      }

      alert('프로젝트가 삭제되었습니다.')
      await fetchProjects()
      onPortfolioUpdate?.()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('프로젝트 삭제에 실패했습니다.')
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingProject(null)
    setFormData({
      title: '',
      description: '',
      category: '주거공간',
      year: new Date().getFullYear().toString(),
      project_address: '',
      images: []
    })
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">포트폴리오 관리</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">총 {projects.length}개 프로젝트</span>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            프로젝트 추가
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {editingProject ? '프로젝트 수정' : '새 프로젝트 추가'}
                </h4>
                <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 제목 *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 모던 아파트 리노베이션"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="주거공간">주거공간</option>
                      <option value="상업공간">상업공간</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 설명 *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="프로젝트에 대한 상세한 설명을 입력해주세요."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">완료 연도 *</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      min="2000"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 주소</label>
                    <input
                      type="text"
                      name="project_address"
                      value={formData.project_address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 서울시 강남구 테헤란로 123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프로젝트 이미지 * (최대 {MAX_IMAGES}개)
                  </label>
                  <div className="space-y-3">
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {imagePreviews.length < MAX_IMAGES && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          onChange={handleImageChange}
                          multiple
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            이미지 추가 ({imagePreviews.length}/{MAX_IMAGES})
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            JPG, PNG, GIF, WEBP (최대 5MB)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isUploading ? '저장 중...' : editingProject ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {project.images && project.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      +{project.images.length - 1} 더보기
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{project.category}</span>
                    <span className="text-xs text-gray-500">{project.year}</span>
                  </div>
                  {project.project_address && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">📍 {project.project_address}</span>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h4>
              <p className="text-gray-500 mb-4">첫 번째 프로젝트를 추가해보세요.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                프로젝트 추가
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
