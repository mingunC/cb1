'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Search, Filter, MapPin, Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronRight, X, Heart, MessageCircle
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
  // UI 표시용 추가 필드들
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
      
      // 실제 데이터베이스에서 업체 데이터 가져오기
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
        // .eq('status', 'active') // 모든 상태의 업체 표시
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contractors:', error)
        setContractors([])
        setFilteredContractors([])
        return
      }

      console.log('📊 Fetched contractors from database:', contractorsData)
      console.log('🏢 Contractor names:', contractorsData.map(c => c.company_name))

      // 데이터베이스 데이터를 UI 인터페이스에 맞게 변환
      const formattedContractors: Contractor[] = contractorsData.map(contractor => ({
        id: contractor.id,
        company_name: contractor.company_name || '업체명 없음',
        contact_name: contractor.contact_name || '담당자 없음',
        phone: contractor.phone || '전화번호 없음',
        email: contractor.email || '이메일 없음',
        website: contractor.website,
        logo_url: contractor.company_logo,
        cover_image: contractor.company_logo, // 로고를 커버 이미지로도 사용
        description: contractor.description || '업체 소개가 없습니다.',
        established_year: contractor.years_in_business ? new Date().getFullYear() - contractor.years_in_business : undefined,
        employee_count: '정보 없음',
        service_areas: ['서울', '경기'], // 기본값
        specialties: Array.isArray(contractor.specialties) ? contractor.specialties : [],
        certifications: ['실내건축공사업'], // 기본값
        rating: contractor.rating || 0,
        review_count: 0, // 기본값
        completed_projects: 0, // 기본값
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

  // 저장된 업체 불러오기
  const loadSavedContractors = () => {
    const saved = localStorage.getItem('saved_contractors')
    if (saved) {
      setSavedContractors(new Set(JSON.parse(saved)))
    }
  }

  // 업체 저장 토글
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

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...contractors]

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 전문분야 필터
    if (filters.specialty !== 'all') {
      filtered = filtered.filter(c => c.specialties.includes(filters.specialty))
    }

    // 지역 필터
    if (filters.area !== 'all') {
      filtered = filtered.filter(c => c.service_areas.includes(filters.area))
    }

    // 예산 필터
    if (filters.budget !== 'all') {
      const budget = parseInt(filters.budget)
      filtered = filtered.filter(c => {
        const minBudget = c.min_budget || 0
        return minBudget <= budget
      })
    }

    // 평점 필터
    if (filters.rating !== 'all') {
      const rating = parseFloat(filters.rating)
      filtered = filtered.filter(c => c.rating >= rating)
    }

    // 정렬
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
          
          {/* 통계 */}
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
          {/* 검색바 */}
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
            
            {/* 뷰 모드 전환 */}
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

          {/* 필터 */}
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
              value={filters.budget}
              onChange={(e) => setFilters(prev => ({ ...prev, budget: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 예산</option>
              <option value="20000000">2천만원 이상</option>
              <option value="30000000">3천만원 이상</option>
              <option value="50000000">5천만원 이상</option>
              <option value="100000000">1억원 이상</option>
            </select>

            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 평점</option>
              <option value="4.5">4.5점 이상</option>
              <option value="4.0">4.0점 이상</option>
              <option value="3.5">3.5점 이상</option>
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
          // 그리드 뷰
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedContractor(contractor)}
              >
                {/* 커버 이미지 */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={contractor.cover_image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=200&fit=crop&crop=center'}
                    alt={contractor.company_name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 배지 */}
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

                  {/* 저장 버튼 */}
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

                {/* 정보 */}
                <div className="p-4">
                  {/* 로고 및 이름 */}
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={contractor.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop&crop=center'}
                      alt={contractor.company_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
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

                  {/* 설명 */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {contractor.description}
                  </p>

                  {/* 전문분야 */}
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

                  {/* 통계 */}
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
          // 리스트 뷰
          <div className="space-y-4">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-6"
                onClick={() => setSelectedContractor(contractor)}
              >
                <div className="flex gap-6">
                  {/* 이미지 */}
                  <img
                    src={contractor.cover_image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=150&fit=crop&crop=center'}
                    alt={contractor.company_name}
                    className="w-48 h-36 rounded-lg object-cover"
                  />

                  {/* 정보 */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {contractor.company_name}
                          </h3>
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
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium ml-1">{contractor.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">
                              (리뷰 {contractor.review_count})
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            설립 {contractor.established_year}년
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSaveContractor(contractor.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
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

                    <p className="text-gray-600 mb-3">{contractor.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>프로젝트 {contractor.completed_projects}건</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{contractor.service_areas.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{contractor.employee_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>응답 {contractor.response_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-1">
                        {contractor.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
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
            {/* 커버 이미지 */}
            <div className="relative h-64">
              <img
                src={selectedContractor.cover_image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=300&fit=crop&crop=center'}
                alt={selectedContractor.company_name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedContractor(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* 헤더 정보 */}
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={selectedContractor.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop&crop=center'}
                  alt={selectedContractor.company_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
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

              {/* 설명 */}
              <p className="text-gray-700 mb-6">{selectedContractor.description}</p>

              {/* 정보 그리드 */}
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

              {/* 전문분야 */}
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

              {/* 서비스 지역 */}
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

              {/* 인증 및 자격 */}
              {selectedContractor.certifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">인증 및 자격</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContractor.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        <Shield className="h-3 w-3" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 최근 프로젝트 */}
              {selectedContractor.recent_projects && selectedContractor.recent_projects.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">최근 프로젝트</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedContractor.recent_projects.map(project => (
                      <div key={project.id} className="relative group cursor-pointer">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <p className="text-white text-sm font-medium px-2 text-center">
                            {project.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 연락처 정보 */}
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
                  <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                    견적 요청하기
                  </button>
                  <button className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    상담 신청
                  </button>
                  <button
                    onClick={() => toggleSaveContractor(selectedContractor.id)}
                    className={`px-6 py-3 border rounded-lg font-medium flex items-center gap-2 ${
                      savedContractors.has(selectedContractor.id)
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${
                      savedContractors.has(selectedContractor.id) ? 'fill-current' : ''
                    }`} />
                    {savedContractors.has(selectedContractor.id) ? '저장됨' : '저장'}
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