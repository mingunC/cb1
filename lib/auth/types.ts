import type { User } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export type UserType = 'customer' | 'contractor' | 'admin'

export type ContractorSummary = Pick<
  Database['public']['Tables']['contractors']['Row'],
  'id' | 'company_name' | 'status'
>

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  userType?: UserType
  contractorData?: ContractorSummary | null
  redirectTo?: string
  error?: string
}

export interface UserProfileResult {
  success: boolean
  userType?: UserType
  contractorData?: ContractorSummary | null
  error?: string
}

