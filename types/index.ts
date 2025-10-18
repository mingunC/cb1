// ============================================
// 1. types/index.ts - 중앙화된 타입 정의
// ============================================
export type ProjectStatus = 
  | 'pending'                // 고객이 견적요청서 제출
  | 'approved'               // 관리자 승인 - 업체가 볼 수 있음
  | 'site-visit-pending'     // 업체가 현장방문 신청
  | 'site-visit-completed'   // 현장방문 완료
  | 'bidding'                // 입찰 진행 중
  | 'bidding-closed'         // 입찰 종료
  | 'quote-submitted'        // (deprecated - bidding-closed 사용)
  | 'completed'              // 프로젝트 완료
  | 'cancelled'              // 취소

export interface Project {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date?: string
  visit_dates?: string[]
  full_address: string
  postal_code: string
  description: string
  photos?: any[]
  status: ProjectStatus
  selected_contractor_id?: string  // 선택된 업체 ID
  selected_quote_id?: string       // 선택된 견적서 ID
  created_at: string
  updated_at: string
}

export interface SiteVisitApplication {
  id: string
  project_id: string
  contractor_id: string
  status: 'pending' | 'approved' | 'completed'
  applied_at: string
  is_cancelled: boolean
  notes?: string
}

export interface ContractorQuote {
  id: string
  project_id: string
  contractor_id: string
  price: number
  description: string
  pdf_url: string
  pdf_filename?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
