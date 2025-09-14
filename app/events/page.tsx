'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { Calendar, Gift, Percent, Clock, ChevronRight, Tag, Users, Home, DollarSign, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Event {
  id: string
  contractor_id?: string
  title: string
  subtitle: string
  description: string
  type: 'discount' | 'gift' | 'special' | 'season' | 'collaboration'
  discount_rate?: number
  original_price?: number
  discounted_price?: number
  image_url: string
  thumbnail_url?: string
  start_date: string
  end_date: string
  is_featured: boolean
  is_active: boolean
  terms_conditions: string[]
  target_space?: string[]
  min_budget?: number
  max_participants?: number
  current_participants?: number
  tags: string[]
  contractor?: {
    company_name: string
    logo_url?: string
  }
  created_at: string
}

type FilterType = 'all' | 'discount' | 'gift' | 'special' | 'season' | 'collaboration'
type StatusFilter = 'all' | 'ongoing' | 'upcoming' | 'ended'

export default function EventsPromotionPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ongoing')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      
      // 더미 데이터 사용 (실제 DB 연결 시 수정)
      const dummyEvents: Event[] = [
        {
          id: '1',
          title: '신년 맞이 전체 시공 20% 할인',
          subtitle: '2025년 새해를 맞아 특별한 혜택을 드립니다',
          description: '새해를 맞아 전체 인테리어 시공 시 20% 할인 혜택을 제공합니다. 주방, 거실, 침실 등 모든 공간 리모델링에 적용됩니다.',
          type: 'discount',
          discount_rate: 20,
          original_price: 50000000,
          discounted_price: 40000000,
          image_url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          is_featured: true,
          is_active: true,
          terms_conditions: [
            '3천만원 이상 시공 시 적용',
            '타 할인 이벤트와 중복 불가',
            '계약금 납부 시점 기준',
            '부분 시공은 제외'
          ],
          target_space: ['전체'],
          min_budget: 30000000,
          max_participants: 50,
          current_participants: 23,
          tags: ['신년이벤트', '할인', '전체시공'],
           contractor: {
             company_name: '디자인하우스',
             logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center'
           },
          created_at: '2024-12-20'
        },
        {
          id: '2',
          title: '주방 리모델링 가전제품 증정',
          subtitle: '독일 프리미엄 주방가전 3종 세트',
          description: '주방 전체 리모델링 계약 시 총 500만원 상당의 독일 프리미엄 주방가전(식기세척기, 오븐, 인덕션)을 무료로 드립니다.',
          type: 'gift',
          image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
          start_date: '2025-01-15',
          end_date: '2025-02-28',
          is_featured: true,
          is_active: true,
          terms_conditions: [
            '주방 전체 리모델링 한정',
            '2천만원 이상 계약 시',
            '선착순 30명',
            '제품 변경 불가'
          ],
          target_space: ['주방'],
          min_budget: 20000000,
          max_participants: 30,
          current_participants: 12,
          tags: ['주방', '가전증정', '프리미엄'],
          contractor: {
            company_name: '키친마스터'
          },
          created_at: '2025-01-10'
        },
        {
          id: '3',
          title: '봄맞이 베란다 확장 특가',
          subtitle: '따뜻한 봄을 준비하는 공간 확장',
          description: '베란다 확장 공사를 특별가로 진행합니다. 단열, 방음, 마감재까지 프리미엄 자재로 시공합니다.',
          type: 'special',
          discount_rate: 30,
          image_url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
          start_date: '2025-02-01',
          end_date: '2025-03-31',
          is_featured: false,
          is_active: false,
          terms_conditions: [
            '아파트 한정',
            '관리사무소 승인 필요',
            '평당 가격 적용'
          ],
          target_space: ['베란다'],
          tags: ['베란다확장', '봄이벤트', '특가'],
          contractor: {
            company_name: '스페이스확장'
          },
          created_at: '2025-01-20'
        },
        {
          id: '4',
          title: '무료 3D 디자인 상담',
          subtitle: '전문 디자이너의 1:1 맞춤 상담',
          description: '인테리어 전문 디자이너가 직접 방문하여 3D 디자인과 견적을 무료로 제공합니다.',
          type: 'special',
          image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          is_featured: false,
          is_active: true,
          terms_conditions: [
            '서울/경기 지역 한정',
            '1가구 1회 한정',
            '상담 후 계약 의무 없음'
          ],
          tags: ['무료상담', '3D디자인', '디자이너'],
          contractor: {
            company_name: '디자인스튜디오'
          },
          created_at: '2024-12-01'
        },
        {
          id: '5',
          title: '카드사 제휴 10% 추가 할인',
          subtitle: '특정 카드 결제 시 추가 혜택',
          description: '삼성카드, 현대카드로 결제 시 시공비 10% 추가 할인 혜택을 드립니다.',
          type: 'collaboration',
          discount_rate: 10,
          image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
          start_date: '2025-01-01',
          end_date: '2025-06-30',
          is_featured: true,
          is_active: true,
          terms_conditions: [
            '제휴 카드사 결제 시',
            '일시불 결제 한정',
            '최대 300만원 할인'
          ],
          tags: ['카드할인', '제휴이벤트'],
          contractor: {
            company_name: '올리모델링'
          },
          created_at: '2024-12-15'
        },
        {
          id: '6',
          title: '여름 특별 패키지',
          subtitle: '시원한 여름을 위한 인테리어',
          description: '에어컨 설치, 단열 시공, 습도 조절 시스템을 패키지로 제공합니다.',
          type: 'season',
          original_price: 15000000,
          discounted_price: 12000000,
          image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          start_date: '2025-05-01',
          end_date: '2025-07-31',
          is_featured: false,
          is_active: false,
          terms_conditions: [
            '패키지 전체 구매 시',
            '설치비 포함'
          ],
          target_space: ['전체'],
          tags: ['여름', '패키지', '시즌특가'],
          contractor: {
            company_name: '쿨인테리어'
          },
          created_at: '2025-04-01'
        }
      ]

      setEvents(dummyEvents)
      setFilteredEvents(dummyEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 필터링 로직
  useEffect(() => {
    let filtered = [...events]
    const now = new Date()

    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType)
    }

    // 상태 필터
    filtered = filtered.filter(event => {
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      switch (statusFilter) {
        case 'ongoing':
          return startDate <= now && endDate >= now
        case 'upcoming':
          return startDate > now
        case 'ended':
          return endDate < now
        default:
          return true
      }
    })

    // 특별 이벤트를 상단에 배치
    filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredEvents(filtered)
  }, [filterType, statusFilter, events])

  // 이벤트 타입 한글 변환
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'discount': '할인',
      'gift': '증정',
      'special': '특별',
      'season': '시즌',
      'collaboration': '제휴'
    }
    return labels[type] || type
  }

  // 이벤트 타입 아이콘
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="h-5 w-5" />
      case 'gift':
        return <Gift className="h-5 w-5" />
      case 'special':
        return <Tag className="h-5 w-5" />
      default:
        return <Tag className="h-5 w-5" />
    }
  }

  // D-Day 계산
  const calculateDday = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return '종료'
    if (diff === 0) return 'D-Day'
    return `D-${diff}`
  }

  // 진행률 계산
  const calculateProgress = (current?: number, max?: number) => {
    if (!current || !max) return 0
    return Math.min((current / max) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-4">이벤트 & 프로모션</h1>
          <p className="text-lg opacity-90">
            레노베이션 전문 업체들의 특별한 혜택을 만나보세요
          </p>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 상태 필터 */}
          <div className="flex gap-6 py-4 border-b">
            {(['ongoing', 'upcoming', 'ended'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`font-medium pb-2 border-b-2 transition-colors ${
                  statusFilter === status
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {status === 'ongoing' && '진행중'}
                {status === 'upcoming' && '예정'}
                {status === 'ended' && '종료'}
                <span className="ml-2 text-sm">
                  ({events.filter(e => {
                    const now = new Date()
                    const start = new Date(e.start_date)
                    const end = new Date(e.end_date)
                    if (status === 'ongoing') return start <= now && end >= now
                    if (status === 'upcoming') return start > now
                    return end < now
                  }).length})
                </span>
              </button>
            ))}
          </div>

          {/* 타입 필터 */}
          <div className="flex gap-2 py-4 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {(['discount', 'gift', 'special', 'season', 'collaboration'] as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getEventIcon(type)}
                {getEventTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 이벤트 목록 */}
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
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">현재 진행중인 이벤트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const dday = calculateDday(event.end_date)
              const progress = calculateProgress(event.current_participants, event.max_participants)
              const isEnded = dday === '종료'

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${
                    isEnded ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* 이미지 */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 배지들 */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {event.is_featured && !isEnded && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          HOT
                        </span>
                      )}
                      <span className={`px-2 py-1 text-white text-xs font-bold rounded ${
                        event.type === 'discount' ? 'bg-orange-500' :
                        event.type === 'gift' ? 'bg-green-500' :
                        event.type === 'special' ? 'bg-purple-500' :
                        event.type === 'season' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>

                    {/* D-Day */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${
                      isEnded ? 'bg-gray-500 text-white' :
                      dday === 'D-Day' ? 'bg-red-500 text-white' :
                      'bg-black/60 text-white'
                    }`}>
                      {dday}
                    </div>

                    {/* 할인율 */}
                    {event.discount_rate && !isEnded && (
                      <div className="absolute bottom-3 left-3 bg-red-500 text-white px-3 py-2 rounded-lg">
                        <div className="text-2xl font-bold">{event.discount_rate}%</div>
                        <div className="text-xs">SALE</div>
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="p-4">
                    {/* 업체명 */}
                    {event.contractor && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">
                          {event.contractor.company_name}
                        </span>
                      </div>
                    )}

                    {/* 제목 */}
                    <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{event.subtitle}</p>

                    {/* 가격 정보 */}
                    {event.original_price && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 line-through">
                            {event.original_price.toLocaleString()}원
                          </span>
                          {event.discounted_price && (
                            <span className="text-lg font-bold text-red-500">
                              {event.discounted_price.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 참여 현황 */}
                    {event.max_participants && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">참여 현황</span>
                          <span className="font-medium">
                            {event.current_participants || 0}/{event.max_participants}명
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 기간 */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString()} ~ 
                        {new Date(event.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* 태그 */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 이미지 */}
            <div className="relative h-64 md:h-80">
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white"
              >
                ✕
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6">
              {/* 업체 정보 */}
              {selectedEvent.contractor && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">
                    {selectedEvent.contractor.company_name}
                  </span>
                </div>
              )}

              {/* 제목 및 설명 */}
              <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
              <p className="text-gray-600 mb-4">{selectedEvent.subtitle}</p>
              <p className="text-gray-700 leading-relaxed mb-6">
                {selectedEvent.description}
              </p>

              {/* 이벤트 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">이벤트 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기간</span>
                    <span className="font-medium">
                      {new Date(selectedEvent.start_date).toLocaleDateString()} ~ 
                      {new Date(selectedEvent.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedEvent.discount_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">할인율</span>
                      <span className="font-medium text-red-500">
                        {selectedEvent.discount_rate}% 할인
                      </span>
                    </div>
                  )}
                  {selectedEvent.target_space && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">대상 공간</span>
                      <span className="font-medium">
                        {selectedEvent.target_space.join(', ')}
                      </span>
                    </div>
                  )}
                  {selectedEvent.min_budget && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">최소 예산</span>
                      <span className="font-medium">
                        {selectedEvent.min_budget.toLocaleString()}원 이상
                      </span>
                    </div>
                  )}
                  {selectedEvent.max_participants && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">참여 현황</span>
                      <span className="font-medium">
                        {selectedEvent.current_participants || 0} / {selectedEvent.max_participants}명
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 이용 조건 */}
              {selectedEvent.terms_conditions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">이용 조건</h3>
                  <ul className="space-y-1">
                    {selectedEvent.terms_conditions.map((term, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  이벤트 참여하기
                </button>
                <button className="px-6 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium">
                  업체 문의
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}