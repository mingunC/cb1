// 페이지네이션
export const ITEMS_PER_PAGE = 9

// Project type mapping
export const PROJECT_TYPE_MAP = {
  'kitchen': { label: 'Kitchen', color: 'bg-orange-100 text-orange-700' },
  'bathroom': { label: 'Bathroom', color: 'bg-blue-100 text-blue-700' },
  'basement': { label: 'Basement', color: 'bg-gray-100 text-gray-700' },
  'flooring': { label: 'Flooring', color: 'bg-amber-100 text-amber-700' },
  'painting': { label: 'Painting', color: 'bg-purple-100 text-purple-700' },
  'full_renovation': { label: 'Full Renovation', color: 'bg-red-100 text-red-700' },
  'office': { label: 'Office', color: 'bg-indigo-100 text-indigo-700' },
  'retail': { label: 'Retail/Store', color: 'bg-green-100 text-green-700' },
  'restaurant': { label: 'Cafe/Restaurant', color: 'bg-yellow-100 text-yellow-700' },
  'education': { label: 'Education', color: 'bg-pink-100 text-pink-700' },
  'hospitality': { label: 'Hospitality/Hospital', color: 'bg-teal-100 text-teal-700' },
  'other': { label: 'Other', color: 'bg-gray-100 text-gray-700' }
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

// Status configurations
export const STATUS_CONFIGS = {
  'pending': { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
  'approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
  'site-visit-applied': { color: 'bg-purple-100 text-purple-800', label: 'Site Visit Applied' },
  'site-visit-completed': { color: 'bg-indigo-100 text-indigo-800', label: 'Site Visit Completed' },
  'bidding': { color: 'bg-orange-100 text-orange-800', label: 'Bidding' },
  'quoted': { color: 'bg-yellow-100 text-yellow-800', label: 'Quote Submitted' },
  'selected': { color: 'bg-green-100 text-green-800', label: 'Selected' },
  'not-selected': { color: 'bg-orange-100 text-orange-800', label: 'Not Selected' },
  'failed-bid': { color: 'bg-red-100 text-red-800', label: 'Failed Bid' },
  'completed': { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
  'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
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
  'not-selected',
  'failed-bid'
] as const

// Budget option labels
export const BUDGET_LABELS: Record<string, string> = {
  'under_50k': 'Under $50K',
  '50k_100k': '$50K - 100K',
  'over_100k': '100K+'
}

// Timeline labels
export const TIMELINE_LABELS: Record<string, string> = {
  'immediate': 'Start Immediately',
  '1_month': 'Within 1 Month',
  '3_months': 'Within 3 Months',
  'planning': 'Planning'
}

// 개발 환경 전용 디버깅 프로젝트 ID
export const DEBUG_PROJECT_IDS = process.env.NODE_ENV === 'development' 
  ? ['58ead562-2045-4d14-8522-53728f72537e', '17b6f660-a10d-48f8-b83b-0ef84dc6511a']
  : []
