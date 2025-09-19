import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 브라우저 클라이언트 (클라이언트 컴포넌트용)
export const createBrowserClient = () => {
  return createClientComponentClient<Database>()
}

// 서버 클라이언트 (서버 컴포넌트용)
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// 기본 클라이언트 (특수한 경우용)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 타입 export
export type { Database }
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
