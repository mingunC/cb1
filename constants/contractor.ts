// 페이지네이션
export const ITEMS_PER_PAGE = 9

// 프로젝트 타입 매핑
export const PROJECT_TYPE_MAP = {
  'kitchen': { label: '주방', color: 'bg-orange-100 text-orange-700' },
  'bathroom': { label: '욕실', color: 'bg-blue-100 text-blue-700' },
  'basement': { label: '지하실', color: 'bg-gray-100 text-gray-700' },
  'flooring': { label: '바닥재', color: 'bg-amber-100 text-amber-700' },
  'painting': { label: '페인팅', color: 'bg-purple-100 text-purple-700' },
  'full_renovation': { label: '전체 리노베이션', color: 'bg-red-100 text-red-700' },
  'office': { label: '사무실', color: 'bg-indigo-100 text-indigo-700' },
  'retail': { label: '상가/매장', color: 'bg-green-100 text-green-700' },
  'restaurant': { label: '카페/식당', color: 'bg-yellow-100 text-yellow-700' },
  'education': { label: '학원/교육', color: 'bg-pink-100 text-pink-700' },
  'hospitality': { label: '숙박/병원', color: 'bg-teal-100 text-teal-700' },
  'other': { label: '기타', color: 'bg-gray-100 text-gray-700' }
} as const

// 부동산 타입 매핑
export const SPACE_TYPE_MAP = {
  'detached_house': { label: 'Detached House', color: 'bg-green-100 text-green-700' },
  'town_house': { label: 'Town House', color: 'bg-blue-100 text-blue-700' },
  'condo': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' },
  'commercial': { label: 'Commercial', color: 'bg-orange-100 text-orange-700' },
  // 추가 매핑 (다른 형식)
  'detached-house': { label: 'Detached House', color: 'bg-green-100 text-green-700' },
  'townhouse': { label: 'Town House', color: 'bg-blue-100 text-blue-700' },
  'apartment': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' },
  'condo-apartment': { label: 'Condo & Apartment', color: 'bg-purple-100 text-purple-700' }
} as const

// 상태별 설정
export const STATUS_CONFIGS = {
  'pending': { color: 'bg-gray-100 text-gray-800', label: '대기중' },
  'approved': { color: 'bg-green-100 text-green-800', label: '승인됨' },
  'site-visit-applied': { color: 'bg-purple-100 text-purple-800', label: '현장방문 신청' },
  'site-visit-completed': { color: 'bg-indigo-100 text-indigo-800', label: '현장방문 완료' },
  'bidding': { color: 'bg-orange-100 text-orange-800', label: '입찰 중' },
  'quoted': { color: 'bg-yellow-100 text-yellow-800', label: '견적서 제출' },
  'selected': { color: 'bg-green-100 text-green-800', label: '선택됨' },
  'not-selected': { color: 'bg-orange-100 text-orange-800', label: '미선택' },
  'completed': { color: 'bg-gray-100 text-gray-800', label: '완료' },
  'cancelled': { color: 'bg-red-100 text-red-800', label: '취소' }
} as const

// 필터 옵션
export const FILTER_OPTIONS = [
  'all', 
  'bidding',
  'approved', 
  'site-visit-applied', 
  'site-visit-completed', 
  'quoted', 
  'selected', 
  'not-selected'
] as const

// 예산 옵션 레이블
export const BUDGET_LABELS: Record<string, string> = {
  'under_50k': '$50,000 미만',
  '50k_100k': '$50,000-$100,000',
  'over_100k': '$100,000 이상'
}

// 타임라인 레이블
export const TIMELINE_LABELS: Record<string, string> = {
  'immediate': '즉시 시작',
  '1_month': '1개월 내',
  '3_months': '3개월 내',
  'planning': '계획중'
}

// 개발 환경 전용 디버깅 프로젝트 ID
export const DEBUG_PROJECT_IDS = process.env.NODE_ENV === 'development' 
  ? ['58ead562-2045-4d14-8522-53728f72537e', '17b6f660-a10d-48f8-b83b-0ef84dc6511a']
  : []
