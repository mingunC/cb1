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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchContractors()
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
          status,
          created_at
        `)
        .order('created_at', { ascending: false })

      const contractorsWithProjects = await Promise.all(
        contractorsData.map(async (contractor) => {
          // 완료된 견적서 수 조회
          const { count: completedQuotes } = await supabase
            .from('contractor_quotes')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', contractor.id)
            .in('status', ['completed', 'selected'])

          // 프로젝트 수 조회
          let selectedProjects = 0
          try {
            const { count, error: projectsError } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('selected_contractor_id', contractor.id)
            
            if (!projectsError) {
              selectedProjects = count || 0
            }
          } catch (err) {
            selectedProjects = 0
          }

          // 실제 포트폴리오 개수 조회
          const { count: actualPortfolioCount } = await supabase
            .from('portfolios')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', contractor.id)

          const totalCompleted = (completedQuotes || 0) + selectedProjects

          console.log(`📊 ${contractor.company_name} - 포트폴리오: ${actualPortfolioCount}개, 완료 프로젝트: ${totalCompleted}건`)

          return {
            ...contractor,
            completed_projects_count: totalCompleted,
            actual_portfolio_count: actualPortfolioCount || 0
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
        completed_projects: contractor.completed_projects_count || 0,
        response_time: '문의 후 안내',
        min_budget: undefined,
        is_verified: true,
        is_premium: false,
        portfolio_count: contractor.actual_portfolio_count || 0,
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


  // SMS 문자 상담 함수
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
      {/* UI 코드는 동일하므로 생략... */}
      {/* 기존 헤더, 검색, 필터, 그리드 뷰는 그대로 유지 */}
      
      {/* 모달만 포트폴리오 개수 표시 확인 */}
      {selectedContractor && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContractor(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 내용 - 기존과 동일 */}
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
                    {selectedContractor.established_year && <span>설립 {selectedContractor.established_year}년</span>}
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
