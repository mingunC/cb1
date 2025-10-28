'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Search, Filter, MapPin, Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronRight, X, MessageCircle, Image as ImageIcon
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
  const [selectedContractorDetails, setSelectedContractorDetails] = useState<{portfolio_count: number, completed_projects: number} | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      // ✅ 최적화: 기본 정보만 한 번에 가져오기
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
          status,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contractors:', error)
        // ✅ return 제거 - finally가 실행되도록
        setContractors([])
        setFilteredContractors([])
      } else {
        // ✅ 추가 쿼리 없이 즉시 포맷팅
        const formattedContractors: Contractor[] = (contractorsData || []).map(contractor => ({
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
          completed_projects: 0, // 상세보기 클릭 시 로드
          response_time: '문의 후 안내',
          min_budget: undefined,
          is_verified: true,
          is_premium: false,
          portfolio_count: 0, // 상세보기 클릭 시 로드
          recent_projects: [],
          created_at: contractor.created_at
        }))

        console.log('✅ 업체 목록 로드 완료:', formattedContractors.length, '개')

        setContractors(formattedContractors)
        setFilteredContractors(formattedContractors)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ 새로운 함수: 업체 상세 정보 로드 (모달 열릴 때만)
  const loadContractorDetails = async (contractorId: string) => {
    try {
      const supabase = createBrowserClient()
      
      // 포트폴리오 개수
      const { count: portfolioCount } = await supabase
        .from('portfolios')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)

      // 완료 프로젝트 수
      const { count: completedQuotes } = await supabase
        .from('contractor_quotes')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractorId)
        .in('status', ['completed', 'selected'])

      setSelectedContractorDetails({
        portfolio_count: portfolioCount || 0,
        completed_projects: completedQuotes || 0
      })
    } catch (error) {
      console.error('Error loading contractor details:', error)
    }
  }

  const handleSMSConsultation = (contractor: Contractor) => {
    const message = encodeURIComponent(`[${contractor.company_name}] 견적 상담 요청합니다.`)
    const phoneNumber = contractor.phone.replace(/[^0-9]/g, '')
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
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Professional Partners</h1>
          <div className="w-20 h-1 bg-amber-600 mb-4"></div>
          <p className="text-base sm:text-xl opacity-90">Meet trusted experts ready to transform your space</p>
        </div>
      </div>

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
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : filteredContractors.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">업체가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContractors.map(contractor => (
              <div
                key={contractor.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedContractor(contractor)
                  setSelectedContractorDetails(null) // 리셋
                  loadContractorDetails(contractor.id) // 상세 정보 로드
                }}
              >
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  {contractor.cover_image ? (
                    <img src={contractor.cover_image} alt={contractor.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-white text-2xl font-bold mb-1">{contractor.company_name}</h3>
                        <p className="text-blue-100 text-sm">Professional Services</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {contractor.logo_url ? (
                      <img src={contractor.logo_url} alt={contractor.company_name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {contractor.company_name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{contractor.company_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{contractor.rating}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{contractor.description}</p>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Briefcase className="h-4 w-4" />
                      <span>상세보기</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                      <span>포트폴리오</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedContractor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContractor(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64">
              {selectedContractor.cover_image ? (
                <img src={selectedContractor.cover_image} alt={selectedContractor.company_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-white text-4xl font-bold mb-2">{selectedContractor.company_name}</h2>
                    <p className="text-emerald-100 text-lg">Professional Services</p>
                  </div>
                </div>
              )}
              <button onClick={() => setSelectedContractor(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                {selectedContractor.logo_url ? (
                  <img src={selectedContractor.logo_url} alt={selectedContractor.company_name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedContractor.company_name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedContractor.company_name}</h2>
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
                    {selectedContractor.established_year && <span>설립 {selectedContractor.established_year}년</span>}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{selectedContractor.description}</p>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">전문분야</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.specialties.length > 0 ? (
                    selectedContractor.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">전문분야 정보 없음</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">서비스 지역</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.service_areas.map((area, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">연락처</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      <a 
                        href={selectedContractor.website.startsWith('http') ? selectedContractor.website : `https://${selectedContractor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedContractor.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link href={`/portfolio?contractor=${selectedContractor.id}`} className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    포트폴리오 보기
                  </Link>
                  <button onClick={() => handleSMSConsultation(selectedContractor)} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Request Consultation
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
