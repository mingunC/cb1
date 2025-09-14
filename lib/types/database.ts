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
      quotes: {
        Row: {
          id: string
          customer_id: string
          contractor_id: string | null
          space_type: 'detached_house' | 'town_house' | 'condo' | 'commercial'
          project_types: string[]
          budget: 'under_50k' | '50k_100k' | 'over_100k'
          timeline: 'immediate' | '1_month' | '3_months' | 'planning'
          postal_code: string
          full_address: string
          visit_dates: string[]
          details: Json
          status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted'
          created_at: string
          updated_at: string
          assigned_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          contractor_id?: string | null
          space_type: 'detached_house' | 'town_house' | 'condo' | 'commercial'
          project_types: string[]
          budget: 'under_50k' | '50k_100k' | 'over_100k'
          timeline: 'immediate' | '1_month' | '3_months' | 'planning'
          postal_code: string
          full_address: string
          visit_date?: string | null
          details?: Json
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted'
          created_at?: string
          updated_at?: string
          assigned_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          contractor_id?: string | null
          space_type?: 'detached_house' | 'town_house' | 'condo'
          project_types?: string[]
          budget?: 'under_50k' | '50k_100k' | 'over_100k'
          timeline?: 'immediate' | '1_month' | '3_months' | 'planning'
          postal_code?: string
          full_address?: string
          visit_date?: string | null
          details?: Json
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted'
          created_at?: string
          updated_at?: string
          assigned_at?: string | null
          completed_at?: string | null
        }
      }
      temp_quotes: {
        Row: {
          id: string
          customer_id: string | null
          session_id: string | null
          space_type: 'detached_house' | 'town_house' | 'condo' | 'commercial' | null
          project_types: string[] | null
          budget: 'under_50k' | '50k_100k' | 'over_100k' | null
          timeline: 'immediate' | '1_month' | '3_months' | 'planning' | null
          postal_code: string | null
          full_address: string | null
          visit_dates: string[]
          details: Json
          step: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          session_id?: string | null
          space_type?: 'detached_house' | 'town_house' | 'condo' | null
          project_types?: string[] | null
          budget?: 'under_50k' | '50k_100k' | 'over_100k' | null
          timeline?: 'immediate' | '1_month' | '3_months' | 'planning' | null
          postal_code?: string | null
          full_address?: string | null
          visit_date?: string | null
          details?: Json
          step?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          session_id?: string | null
          space_type?: 'detached_house' | 'town_house' | 'condo' | null
          project_types?: string[] | null
          budget?: 'under_50k' | '50k_100k' | 'over_100k' | null
          timeline?: 'immediate' | '1_month' | '3_months' | 'planning' | null
          postal_code?: string | null
          full_address?: string | null
          visit_date?: string | null
          details?: Json
          step?: number
          created_at?: string
          updated_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          address: string | null
          license_number: string | null
          insurance_info: string | null
          specialties: Json
          years_experience: number
          portfolio_count: number
          rating: number
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          license_number?: string | null
          insurance_info?: string | null
          specialties?: Json
          years_experience?: number
          portfolio_count?: number
          rating?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          license_number?: string | null
          insurance_info?: string | null
          specialties?: Json
          years_experience?: number
          portfolio_count?: number
          rating?: number
          status?: 'active' | 'inactive' | 'suspended'
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
          project_type: string
          space_type: string
          budget_range: string | null
          completion_date: string | null
          photos: Json
          thumbnail_url: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          title: string
          description?: string | null
          project_type: string
          space_type: string
          budget_range?: string | null
          completion_date?: string | null
          photos?: Json
          thumbnail_url?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          title?: string
          description?: string | null
          project_type?: string
          space_type?: string
          budget_range?: string | null
          completion_date?: string | null
          photos?: Json
          thumbnail_url?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          contractor_id: string
          customer_id: string
          quote_id: string | null
          rating: number
          title: string
          comment: string
          photos: Json
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          customer_id: string
          quote_id?: string | null
          rating: number
          title: string
          comment: string
          photos?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          customer_id?: string
          quote_id?: string | null
          rating?: number
          title?: string
          comment?: string
          photos?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: 'workshop' | 'seminar' | 'showcase' | 'other'
          start_date: string
          end_date: string | null
          location: string | null
          address: string | null
          max_attendees: number | null
          current_attendees: number
          registration_required: boolean
          registration_deadline: string | null
          cover_image_url: string | null
          details: Json
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: 'workshop' | 'seminar' | 'showcase' | 'other'
          start_date: string
          end_date?: string | null
          location?: string | null
          address?: string | null
          max_attendees?: number | null
          current_attendees?: number
          registration_required?: boolean
          registration_deadline?: string | null
          cover_image_url?: string | null
          details?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: 'workshop' | 'seminar' | 'showcase' | 'other'
          start_date?: string
          end_date?: string | null
          location?: string | null
          address?: string | null
          max_attendees?: number | null
          current_attendees?: number
          registration_required?: boolean
          registration_deadline?: string | null
          cover_image_url?: string | null
          details?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_role: {
        Args: {
          user_id: string
          new_role: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: {
          user_id?: string
        }
        Returns: string
      }
      is_admin: {
        Args: {
          user_id?: string
        }
        Returns: boolean
      }
      get_contractor_profile: {
        Args: {
          user_id?: string
        }
        Returns: {
          id: string
          business_name: string
          contact_name: string
          email: string
          phone: string
          is_verified: boolean
          is_active: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
