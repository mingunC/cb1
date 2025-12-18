'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin, Star, Calendar, FileText, Plus, Trash2 } from 'lucide-react'

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
  
  const router = useRouter()

  // 새 업체 입력 폼 상태
  const [newContractor, setNewContractor] = useState({
    email: '',
    password: '',
    company_name: '',
    contact_name: '',
    phone: '',
    address: '',
    license_number: '',
    insurance_info: '',
    specialties: [] as string[],
    years_experience: 0
  })

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
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/contractors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContractor),
      })

      const result = await response.json()

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
        license_number: '',
        insurance_info: '',
        specialties: [],
        years_experience: 0
      })
      
      await fetchData()
    } catch (error) {
      console.error('Create contractor error:', error)
      alert(error instanceof Error ? error.message : '업체 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContractor = async () => {
    if (!showDeleteModal) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/contractors/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
        {/* Rest of the component continues... */}
      </div>
    </div>
  )
}
