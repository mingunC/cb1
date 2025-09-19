export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          user_type: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          user_type?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          user_type?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          user_id: string
          company_name: string
          email: string
          phone: string | null
          address: string | null
          status: string
          specialties: Json | null
          years_experience: number
          portfolio_count: number
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          email: string
          phone?: string | null
          address?: string | null
          status?: string
          specialties?: Json | null
          years_experience?: number
          portfolio_count?: number
          rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          status?: string
          specialties?: Json | null
          years_experience?: number
          portfolio_count?: number
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      quote_requests: {
        Row: {
          id: string
          customer_id: string
          space_type: string
          project_types: string[] | null
          budget: string
          timeline: string
          postal_code: string
          full_address: string
          visit_date: string | null
          description: string | null
          photos: string[] | null
          status: string
          created_at: string
          updated_at: string
          visit_dates: string[] | null
          selected_contractor_id: string | null
          selected_quote_id: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          space_type: string
          project_types?: string[] | null
          budget: string
          timeline: string
          postal_code: string
          full_address: string
          visit_date?: string | null
          description?: string | null
          photos?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
          visit_dates?: string[] | null
          selected_contractor_id?: string | null
          selected_quote_id?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          space_type?: string
          project_types?: string[] | null
          budget?: string
          timeline?: string
          postal_code?: string
          full_address?: string
          visit_date?: string | null
          description?: string | null
          photos?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
          visit_dates?: string[] | null
          selected_contractor_id?: string | null
          selected_quote_id?: string | null
        }
      }
      contractor_quotes: {
        Row: {
          id: string
          project_id: string
          contractor_id: string
          price: number
          timeline: string
          description: string | null
          status: string
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          contractor_id: string
          price: number
          timeline: string
          description?: string | null
          status?: string
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          contractor_id?: string
          price?: number
          timeline?: string
          description?: string | null
          status?: string
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      site_visit_applications: {
        Row: {
          id: string
          project_id: string
          contractor_id: string
          proposed_date: string
          proposed_time: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          contractor_id: string
          proposed_date: string
          proposed_time?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          contractor_id?: string
          proposed_date?: string
          proposed_time?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          contractor_id: string
          title: string
          description: string | null
          images: string[]
          project_type: string
          duration: string | null
          budget_range: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          title: string
          description?: string | null
          images: string[]
          project_type: string
          duration?: string | null
          budget_range?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          title?: string
          description?: string | null
          images?: string[]
          project_type?: string
          duration?: string | null
          budget_range?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      validate_project_completion: {
        Args: {}
        Returns: Array<{
          project_id: string
          project_status: string
          accepted_quotes_count: number
          is_valid: boolean
          issue_description: string
        }>
      }
      fix_project_status_consistency: {
        Args: {}
        Returns: Array<{
          fixed_count: number
          details: string
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
