// ============================================
// 1. types/index.ts - 중앙화된 타입 정의
// ============================================
export type ProjectStatus = 
  | 'pending'
  | 'approved'
  | 'site-visit-pending'
  | 'site-visit-completed'
  | 'bidding'
  | 'quote-submitted'
  | 'completed'
  | 'cancelled'

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
