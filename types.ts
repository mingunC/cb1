// types.ts
export interface Quote {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  status_detail: 'pending' | 'approved' | 'site_visit_requested' | 'site_visit_cancelled' | 'site_visit_completed' | 'quoted' | 'contracted'
  project_types?: string[]
  space_type?: string
  budget?: string
  timeline?: string
  full_address?: string
  description?: string
  created_at: string
  updated_at?: string
  // ... other fields
}

export interface SiteVisitApplication {
  id: string
  quote_id: string
  contractor_id: string
  is_cancelled: boolean
  cancelled_at?: string
  cancelled_by?: string
  created_at: string
  applied_at?: string
  status?: string
  // ... other fields
}

export interface Contractor {
  id: string
  user_id: string
  company_name: string
  company_logo?: string
  contact_name: string
  status: string
  // ... other fields
}
