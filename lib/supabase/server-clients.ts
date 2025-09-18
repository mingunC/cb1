import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  // 서버 사이드에서는 service role key를 사용하여 RLS를 우회
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // service role key가 없으면 anon key 사용 (fallback)
  const key = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false
    }
  })
}
