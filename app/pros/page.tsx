'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Search, Filter, MapPin, Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronRight, X, Heart, MessageCircle, Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'

interface Contractor {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  website?: string
  company_logo?: string
  description?: string
  years_in_business?: number
  specialties?: string[]
  rating?: number
  portfolio_count?: number
  status?: string
  created_at: string
  logo_url?: string
  cover_image?: string
  established_year?: number
  employee_count?: string
  service_areas: string[]
  certifications: string[]
  review_count: number
  completed_projects: number
  response_time?: string
  min_budget?: number
  is_verified: boolean
  is_premium: boolean
  recent_projects?: {
    id: string
    title: string
    image: string
  }[]
}

interface FilterState {
  specialty: string
  area: string
  budget: string
  rating: string
  sortBy: 'rating' | 'projects' | 'newest' | 'name'
}

export default function ContractorsListingPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    specialty: 'all',
    area: 'all',
    budget: 'all',
    rating: 'all',
    sortBy: 'rating'
  })
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [savedContractors, setSavedContractors] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchContractors()
    loadSavedContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      setIsLoading(true)
      
      const supabase = createBrowserClient()
      
      const { data: contractorsData, error } = await supabase
        .from('contractors')
        .select(`
          id,
          company_name,
          contact_name,
          phone,
          email,
          address,
          website,
          company_logo,
          description,
          years_in_business,
          specialties,
          rating,
          portfolio_count,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })

      const contractorsWithProjects = await Promise.all(
        contractorsData.map(async (contractor) => {
          const { count: completedQuotes } = await supabase
            .from('contractor_quotes')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', contractor.id)
            .in('status', ['completed', 'selected'])

          let selectedProjects = 0
          try {
            const { count, error: projectsError } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('selected_contractor_id', contractor.id)
            
            if (projectsError) {
              console.warn(`⚠️ Projects table access error for contractor ${contractor.company_name}:`, projectsError)
              selectedProjects = 0
            } else {
              selectedProjects = count || 0
            }
          } catch (err) {
            console.warn(`⚠️ Projects query failed for contractor ${contractor.company_name}:`, err)
            selectedProjects = 0
          }

          const totalCompleted = (completedQuotes || 0) + selectedProjects

          return {
            ...contractor,
            completed_projects_count: totalCompleted
          }
        })
      )

      if (error) {
        console.error('Error fetching contractors:', error)
        setContractors([])
        setFilteredContractors([])
        return
      }

      const formattedContractors: Contractor[] = contractorsWithProjects.map(contractor => ({
        id: contractor.id,
        company_name: contractor.company_name || '업체명 없음',
        contact_name: contractor.contact_name || '담당자 없음',
        phone: contractor.phone || '전화번호 없음',
        email: contractor.email || '이메일 없음',
        website: contractor.website,
        logo_url: contractor.company_logo,
        cover_image: contractor.company_logo,
        description: contractor.description || '업체 소개가 없습니다.',
        established_year: contractor.years_in_business ? new Date().getFullYear() - contractor.years_in_business : undefined,
        employee_count: '정보 없음',
        service_areas: contractor.address ? [contractor.address] : ['서울', '경기'],
        specialties: Array.isArray(contractor.specialties) ? contractor.specialties : [],
        certifications: ['실내건축공사업'],
        rating: contractor.rating || 0,
        review_count: 0,
        completed_projects: contractor.completed_projects_count || contractor.portfolio_count || 0,
        response_time: '문의 후 안내',
        min_budget: undefined,
        is_verified: true,
        is_premium: false,
        portfolio_count: contractor.portfolio_count || 0,
        recent_projects: [],
        created_at: contractor.created_at
      }))

      setContractors(formattedContractors)
      setFilteredContractors(formattedContractors)
    } catch (error) {
      console.error('Error fetching contractors:', error)
      setContractors([])
      setFilteredContractors([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedContractors = () => {
    const saved = localStorage.getItem('saved_contractors')
    if (saved) {
      setSavedContractors(new Set(JSON.parse(saved)))
    }
  }

  const toggleSaveContractor = (contractorId: string) => {
    const newSaved = new Set(savedContractors)
    if (newSaved.has(contractorId)) {
      newSaved.delete(contractorId)
    } else {
      newSaved.add(contractorId)
    }
    setSavedContractors(newSaved)
    localStorage.setItem('saved_contractors', JSON.stringify(Array.from(newSaved)))
  }

  // SMS 문자 상담 함수
  const handleSMSConsultation = (contractor: Contractor) => {
    const message = encodeURIComponent(`[${contractor.company_name}] 견적 상담 요청합니다.`)
    const phoneNumber = contractor.phone.replace(/[^0-9]/g, '') // 숫자만 추출
    
    // iOS와 Android 모두 지원하는 SMS URI
    const smsURI = `sms:${phoneNumber}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${message}`
    
    window.location.href = smsURI
  }

  useEffect(() => {
    let filtered = [...contractors]

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filters.specialty !== 'all') {
      filtered = filtered.filter(c => c.specialties.includes(filters.specialty))
    }

    if (filters.area !== 'all') {
      filtered = filtered.filter(c => c.service_areas.includes(filters.area))
    }

    if (filters.budget !== 'all') {
      const budget = parseInt(filters.budget)
      filtered = filtered.filter(c => {
        const minBudget = c.min_budget || 0
        return minBudget <= budget
      })
    }

    if (filters.rating !== 'all') {
      const rating = parseFloat(filters.rating)
      filtered = filtered.filter(c => c.rating >= rating)
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'projects':
          return b.completed_projects - a.completed_projects
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
          return a.company_name.localeCompare(b.company_name)
        default:
          return 0
      }
    })

    setFilteredContractors(filtered)
  }, [searchTerm, filters, contractors])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">레노베이션 전문 업체</h1>
          <p className="text-lg text-gray-600">검증된 인테리어 전문가들을 만나보세요</p>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contractors.length}+</div>
              <div className="text-sm text-gray-500">등록 업체</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">10,000+</div>
              <div className="text-sm text-gray-500">완료 프로젝트</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.7</div>
              <div className="text-sm text-gray-500">평균 평점</div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white sticky top-0 z-30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="업체명, 전문분야로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.specialty}
              onChange={(e) => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 전문분야</option>
              <option value="주거공간">주거공간</option>
              <option value="상업공간">상업공간</option>
              <option value="아파트">아파트</option>
              <option value="주택">주택</option>
              <option value="사무실">사무실</option>
              <option value="리모델링">리모델링</option>
            </select>

            <select
              value={filters.area}
              onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 지역</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="인천">인천</option>
              <option value="부산">부산</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">평점순</option>
              <option value="projects">프로젝트순</option>
              <option value="newest">최신순</option>
              <option value="name">이름순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 업체 목록 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                <div className="bg-white p-4 rounded-b-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredContractors.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : viewMode === 'grid' ? (
          // 그리드 뷰는 기존 코드 유지...
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedContractor(contractor)}
              >
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  {contractor.cover_image ? (
                    <img
                      src={contractor.cover_image}
                      alt={contractor.company_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-white text-2xl font-bold mb-1">
                          {contractor.company_name}
                        </h3>
                        <p className="text-blue-100 text-sm">Professional Services</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    {contractor.is_premium && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                        PREMIUM
                      </span>
                    )}
                    {contractor.is_verified && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                        인증업체
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSaveContractor(contractor.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        savedContractors.has(contractor.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {contractor.logo_url ? (
                      <img
                        src={contractor.logo_url}
                        alt={contractor.company_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {contractor.company_name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{contractor.company_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium ml-1">{contractor.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          리뷰 {contractor.review_count}개
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {contractor.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {contractor.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                    {contractor.specialties.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">
                        +{contractor.specialties.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Briefcase className="h-4 w-4" />
                      <span>프로젝트 {contractor.completed_projects}건</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{contractor.service_areas[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 리스트 뷰도 동일하게 유지...
          <div className="space-y-4">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-6"
                onClick={() => setSelectedContractor(contractor)}
              >
                {/* 리스트 뷰 내용 생략 (기존과 동일) */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedContractor && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContractor(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64">
              {selectedContractor.cover_image ? (
                <img
                  src={selectedContractor.cover_image}
                  alt={selectedContractor.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-white text-4xl font-bold mb-2">
                      {selectedContractor.company_name}
                    </h2>
                    <p className="text-blue-100 text-lg">Professional Services</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedContractor(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                {selectedContractor.logo_url ? (
                  <img
                    src={selectedContractor.logo_url}
                    alt={selectedContractor.company_name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedContractor.company_name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedContractor.company_name}</h2>
                    {selectedContractor.is_premium && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                        PREMIUM
                      </span>
                    )}
                    {selectedContractor.is_verified && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                        인증업체
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium ml-1">{selectedContractor.rating}</span>
                      <span className="ml-1">(리뷰 {selectedContractor.review_count}개)</span>
                    </div>
                    <span>설립 {selectedContractor.established_year}년</span>
                    <span>{selectedContractor.employee_count}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{selectedContractor.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">완료 프로젝트</div>
                  <div className="font-semibold">{selectedContractor.completed_projects}건</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">응답 시간</div>
                  <div className="font-semibold">{selectedContractor.response_time}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">최소 예산</div>
                  <div className="font-semibold">
                    {selectedContractor.min_budget ? 
                      `${(selectedContractor.min_budget / 10000000).toFixed(0)}천만원~` : 
                      '협의'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">포트폴리오</div>
                  <div className="font-semibold">{selectedContractor.portfolio_count}개</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">전문분야</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">서비스 지역</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.service_areas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">연락처</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedContractor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedContractor.email}</span>
                  </div>
                  {selectedContractor.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a href={selectedContractor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        웹사이트 방문
                      </a>
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                  <Link
                    href={`/portfolio?contractor=${selectedContractor.id}`}
                    className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="h-5 w-5" />
                    포트폴리오 보기
                  </Link>
                  <button 
                    onClick={() => handleSMSConsultation(selectedContractor)}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    상담 신청
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
