'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

export default function TestContractorLoginPage() {
  const [email, setEmail] = useState('micks1@me.com')
  const [password, setPassword] = useState('Gchlalsrjs1!')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo(null)

    try {
      const supabase = createBrowserClient()
      
      console.log('🔑 시작: 업체 로그인 테스트')
      
      // 1. 로그인 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('❌ 로그인 실패:', authError)
        toast.error(`로그인 실패: ${authError.message}`)
        return
      }

      console.log('✅ 로그인 성공:', authData.user.email)
      
      // 2. 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔐 세션 확인:', { hasSession: !!session, sessionError })

      // 3. 업체 정보 확인
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle()

      console.log('🏢 업체 정보:', contractorData)

      const debug = {
        step1_auth: {
          success: !!authData.user,
          email: authData.user.email,
          userId: authData.user.id
        },
        step2_session: {
          active: !!session,
          error: sessionError?.message
        },
        step3_contractor: {
          found: !!contractorData,
          company: contractorData?.company_name,
          status: contractorData?.status,
          error: contractorError?.message
        },
        cookies: {
          // 쿠키 상태는 브라우저에서 확인 필요
          message: "브라우저 개발자 도구 > Application > Cookies에서 확인"
        }
      }

      setDebugInfo(debug)

      if (contractorData && contractorData.status === 'active') {
        toast.success(`${contractorData.company_name} 로그인 성공!`)
        
        // 잠시 대기 후 contractor 페이지로 이동
        setTimeout(() => {
          console.log('🚀 /contractor 페이지로 이동 시도')
          router.push('/contractor')
        }, 2000)
      } else {
        toast.error('활성화된 업체 계정이 아닙니다')
      }

    } catch (error: any) {
      console.error('💥 오류:', error)
      toast.error(`오류: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkCurrentSession = async () => {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    setDebugInfo({
      current_session: {
        active: !!session,
        email: session?.user?.email,
        expires: session?.expires_at
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            업체 로그인 테스트
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            디버깅용 테스트 페이지
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인 테스트'}
            </button>
            
            <button
              type="button"
              onClick={checkCurrentSession}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              세션 확인
            </button>
          </div>
        </form>

        {debugInfo && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-medium mb-2">디버그 정보:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => router.push('/contractor-login')}
            className="text-blue-600 hover:text-blue-500"
          >
            일반 로그인 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  )
}
