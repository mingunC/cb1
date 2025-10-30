'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Search, Filter, MapPin, Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronRight, MessageCircle, Image as ImageIcon
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
        // 1) 기본 데이터 포맷팅
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
          review_count: 0, // 아래에서 실제 리뷰 수로 덮어씀
          completed_projects: 0, // 상세보기 클릭 시 로드
          response_time: '문의 후 안내',
          min_budget: undefined,
          is_verified: true,
          is_premium: false,
          portfolio_count: 0, // 상세보기 클릭 시 로드
          recent_projects: [],
          created_at: contractor.created_at
        }))

        // 2) 리뷰 수 일괄 조회 후 매핑
        const contractorIds = formattedContractors.map(c => c.id)
        let reviewCountMap = new Map<string, number>()
        if (contractorIds.length > 0) {
          const { data: reviewsList, error: reviewsError } = await supabase
            .from('reviews')
            .select('contractor_id')
            .in('contractor_id', contractorIds)

          if (reviewsError) {
            console.error('Error fetching review counts:', reviewsError)
          } else if (reviewsList) {
            // 클라이언트에서 개수 집계
            reviewCountMap = reviewsList.reduce((map, row) => {
              const id = row.contractor_id as string
              map.set(id, (map.get(id) || 0) + 1)
              return map
            }, new Map<string, number>())
          }
        }

        const contractorsWithCounts = formattedContractors.map(c => ({
          ...c,
          review_count: reviewCountMap.get(c.id) || 0
        }))

        console.log('✅ 업체 목록 로드 완료:', contractorsWithCounts.length, '개')

        setContractors(contractorsWithCounts)
        setFilteredContractors(contractorsWithCounts)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
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
              <Link
                key={contractor.id}
                href={`/pros/${contractor.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer block"
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
                        <span className="text-sm text-gray-600">({contractor.review_count} reviews)</span>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
