// 프로젝트 상태 타입
export type ProjectStatus = 
  | 'pending'              // 고객 견적요청 (대기중)
  | 'approved'             // 관리자 승인됨
  | 'site-visit-applied'   // 현장방문 신청함
  | 'site-visit-completed' // 현장방문 완료
  | 'quoted'               // 견적서 제출함
  | 'selected'             // 고객에게 선택됨
  | 'not-selected'         // 선택 안됨
  | 'completed'            // 완료됨
  | 'cancelled'            // 취소됨

// 프로젝트 인터페이스
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
  status: string
  status_detail?: string
  created_at: string
  updated_at: string

  // 관계 데이터
  customer?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    phone?: string | null
  }
  site_visit_application?: {
    id: string
    contractor_id: string
    is_cancelled: boolean
    applied_at: string
  }
  contractor_quote?: {
    id: string
    price: number
    description: string | null
    detailed_description?: string | null
    pdf_url: string | null
    pdf_filename?: string | null
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'submitted'
    created_at: string
  }
  
  // 프로젝트 상태 (클라이언트 계산용)
  projectStatus?: ProjectStatus
}

// 업체 데이터 인터페이스
export interface ContractorData {
  id: string
  company_name: string
  contact_name: string
  status: string
}

// 견적서 모달 Props
export interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  mode: 'create' | 'view'
  contractorId?: string
  onSuccess: () => void
}

// 프로젝트 카드 Props
export interface ProjectCardProps {
  project: Project
  contractorId: string
  onSiteVisitApply: (projectId: string) => void
  onSiteVisitCancel: (applicationId: string, projectId: string) => void
  onQuoteCreate: (project: Project) => void
  onQuoteView: (project: Project) => void
}

// 필터 Props
export interface ProjectFiltersProps {
  currentFilter: ProjectStatus | 'all'
  onFilterChange: (filter: ProjectStatus | 'all') => void
  statusCounts: Record<ProjectStatus | 'all', number>
}