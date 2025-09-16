// ============================================
// 3. lib/project-status.ts - 상태 관리 유틸
// ============================================
import type { ProjectStatus } from '@/types'

export const PROJECT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SITE_VISIT_PENDING: 'site-visit-pending',
  SITE_VISIT_COMPLETED: 'site-visit-completed',
  BIDDING: 'bidding',
  QUOTE_SUBMITTED: 'quote-submitted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  'pending': '대기중',
  'approved': '승인됨',
  'site-visit-pending': '현장방문 대기',
  'site-visit-completed': '현장방문 완료',
  'bidding': '입찰중',
  'quote-submitted': '견적 제출완료',
  'completed': '완료',
  'cancelled': '취소'
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'approved': 'bg-green-100 text-green-800',
  'site-visit-pending': 'bg-blue-100 text-blue-800',
  'site-visit-completed': 'bg-purple-100 text-purple-800',
  'bidding': 'bg-orange-100 text-orange-800',
  'quote-submitted': 'bg-indigo-100 text-indigo-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
}

// 상태 전환 규칙
export const STATUS_FLOW: Record<ProjectStatus, ProjectStatus[]> = {
  'pending': ['approved', 'cancelled'],
  'approved': ['site-visit-pending', 'cancelled'],
  'site-visit-pending': ['site-visit-completed', 'cancelled'],
  'site-visit-completed': ['bidding', 'cancelled'],
  'bidding': ['quote-submitted', 'cancelled'],
  'quote-submitted': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': ['approved']
}
