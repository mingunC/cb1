'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Upload, X, Edit3, Trash2, Image as ImageIcon } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'

interface PortfolioProject {
  id: string
  title: string
  description: string
  image: string
  category: string
  year: string
}

interface PortfolioManagerProps {
  contractorId: string
  onPortfolioUpdate?: () => void
}

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
    image: null as File | null
  })

  // 포트폴리오 프로젝트 로드
  useEffect(() => {
    fetchProjects()
  }, [contractorId])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/portfolio?contractor_id=${contractorId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
      } else {
        console.error('Failed to fetch projects:', data.error)
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
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || (!formData.image && !editingProject)) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setIsUploading(true)

    try {
      let imageUrl = editingProject?.image || ''

      // 새 이미지가 있는 경우 업로드
      if (formData.image) {
        const supabase = createBrowserClient()
        
        // 이미지 업로드
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${contractorId}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, formData.image)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert('이미지 업로드에 실패했습니다.')
          return
        }

        // 이미지 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // API 호출
      const url = editingProject ? '/api/portfolio' : '/api/portfolio'
      const method = editingProject ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingProject && { id: editingProject.id }),
          contractor_id: contractorId,
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          category: formData.category,
          year: formData.year
        })
      })

      const data = await response.json()

      if (response.ok) {
        // 성공 시 프로젝트 목록 새로고침
        await fetchProjects()
        
        // 폼 초기화
        setFormData({
          title: '',
          description: '',
          category: '주거공간',
          year: new Date().getFullYear().toString(),
          image: null
        })
        setShowAddForm(false)
        setEditingProject(null)
        
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        onPortfolioUpdate?.()
        alert(editingProject ? '프로젝트가 수정되었습니다.' : '프로젝트가 추가되었습니다.')
      } else {
        alert(data.error || '포트폴리오 저장에 실패했습니다.')
      }
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
      image: null
    })
    setShowAddForm(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/portfolio?id=${projectId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchProjects()
        onPortfolioUpdate?.()
        alert('프로젝트가 삭제되었습니다.')
      } else {
        alert(data.error || '프로젝트 삭제에 실패했습니다.')
      }
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
      image: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">포트폴리오 관리</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            총 {projects.length}개 프로젝트
          </span>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            프로젝트 추가
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      )}

      {/* 포트폴리오 목록 */}
      {!isLoading && (
        <>
          {/* 추가/수정 폼 */}
          {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingProject ? '프로젝트 수정' : '새 프로젝트 추가'}
            </h4>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 제목 *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 설명 *
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  완료 연도 *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2020"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 이미지 *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingProject}
                />
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

      {/* 포트폴리오 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-w-16 aspect-h-12 bg-gray-100">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{project.category}</span>
                <span className="text-xs text-gray-500">{project.year}</span>
              </div>
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
