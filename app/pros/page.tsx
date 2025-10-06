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

      if (error) {
        console.error('Error fetching contractors:', error)
        return
      }

      const contractorsWithCounts = await Promise.all(
        (contractorsData || []).map(async (contractor) => {
          // 실제 포트폴리오 개수
          const { count: portfolioCount } = await supabase
            .from('portfolios')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', contractor.id)

          // 완료 프로젝트 수
          const { count: completedQuotes } = await supabase
            .from('contractor_quotes')
            .select('*', { count: 'exact', head: true })
            .eq('contractor_id', contractor.id)
            .in('status', ['completed', 'selected'])

          return {
            ...contractor,
            actual_portfolio_count: portfolioCount || 0,
            completed_projects_count: completedQuotes || 0
          }
        })
      )

      const formattedContractors: Contractor[] = contractorsWithCounts.map(contractor => ({
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
        completed_projects: contractor.completed_projects_count,
        response_time: '문의 후 안내',
        min_budget: undefined,
        is_verified: true,
        is_premium: false,
        portfolio_count: contractor.actual_portfolio_count,
        recent_projects: [],
        created_at: contractor.created_at
      }))

      console.log('✅ 업체 목록:', formattedContractors.map(c => ({ 
        name: c.company_name, 
        portfolio: c.portfolio_count 
      })))

      setContractors(formattedContractors)
      setFilteredContractors(formattedContractors)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">레노베이션 전문 업체</h1>
          <p className="text-lg text-gray-600">검증된 인테리어 전문가들을 만나보세요</p>
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
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">로딩 중...</div>
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
                onClick={() => setSelectedContractor(contractor)}
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
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
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
                      <span>프로젝트 {contractor.completed_projects}건</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                      <span>포트폴리오 {contractor.portfolio_count}개</span>
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
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <h2 className="text-white text-4xl font-bold">{selectedContractor.company_name}</h2>
                </div>
              )}
              <button onClick={() => setSelectedContractor(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">포트폴리오</div>
                  <div className="font-semibold">{selectedContractor.portfolio_count}개</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex gap-3">
                  <Link href={`/portfolio?contractor=${selectedContractor.id}`} className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    포트폴리오 보기
                  </Link>
                  <button onClick={() => handleSMSConsultation(selectedContractor)} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
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
