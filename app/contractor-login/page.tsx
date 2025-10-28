'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, User, LogOut } from 'lucide-react'
import { signIn, getCurrentUser, signOut } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

// 타입 정의
interface FormData {
  email: string
  password: string
}

interface CurrentUser {
  email: string
  userType?: 'customer' | 'contractor' | 'admin'
  contractorData?: {
    company_name: string
  }
}

export default function ContractorLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  
  const router = useRouter()
  const supabase = createBrowserClient()

  // 세션 체크 - 이미 로그인된 상태 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userInfo = await getCurrentUser()
        
        if (userInfo.user) {
          setCurrentUser({
            email: userInfo.user.email || '',
            userType: userInfo.userType,
            contractorData: userInfo.contractorData
          })
        }
        setCheckingSession(false)
      } catch (error) {
        console.error('Session check error:', error)
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  // 로그아웃 처리
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const result = await signOut()
      
      if (result.success) {
        toast.success('로그아웃되었습니다')
        setCurrentUser(null)
        setIsLoading(false)
      } else {
        toast.error(result.error || '로그아웃 실패')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('로그아웃 중 오류가 발생했습니다')
      setIsLoading(false)
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 새로운 통합 로그인 함수 사용
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.')
        setIsLoading(false)
        return
      }

      // 업체 계정 확인
      if (result.userType !== 'contractor') {
        setError('업체 계정이 아닙니다. 업체 회원가입을 해주세요.')
        setIsLoading(false)
        return
      }

      // 로그인 성공
      console.log('Contractor login successful:', result.user?.email)
      toast.success(`${result.contractorData?.company_name} 계정으로 로그인되었습니다`)
      router.push('/contractor')
      
    } catch (err: any) {
      console.error('Unexpected error during login:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }, [formData, router])

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=contractor`
        }
      })

      if (googleError) {
        console.error('Google login error:', googleError)
        setError('Google 로그인에 실패했습니다.')
        toast.error('Google 로그인에 실패했습니다')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Google 로그인 중 오류가 발생했습니다.')
      toast.error('Google 로그인 중 오류가 발생했습니다')
      setIsLoading(false)
    }
  }, [supabase])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 입력 시 에러 메시지 제거
    if (error) setError('')
  }, [error])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // 세션 체크 중
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인된 경우
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>홈으로 돌아가기</span>
            </Link>
          </div>
          
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              이미 로그인되어 있습니다
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <User className="h-8 w-8 text-emerald-600" />
              </div>
              
              <p className="text-lg font-medium text-gray-900 mb-1">
                {currentUser.contractorData?.company_name || currentUser.email}
              </p>
              <p className="text-sm text-gray-500">
                {currentUser.email}
              </p>
              
              {currentUser.userType === 'contractor' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-3">
                  업체 계정
                </span>
              )}
              {currentUser.userType === 'customer' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    일반 고객 계정으로 로그인되어 있습니다.
                    업체 계정으로 로그인하려면 로그아웃 후 다시 시도해주세요.
                  </p>
                </div>
              )}
              {currentUser.userType === 'admin' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    관리자 계정으로 로그인되어 있습니다.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {currentUser.userType === 'contractor' && (
                <Link
                  href="/contractor"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  업체 대시보드로 이동
                </Link>
              )}
              {currentUser.userType === 'admin' && (
                <Link
                  href="/admin"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  관리자 대시보드로 이동
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2" />
                    로그아웃 중...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃하고 다시 로그인
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                다른 계정으로 로그인하려면 먼저 로그아웃해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 로그인 폼
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>
        
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            업체 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            전문 업체 계정으로 로그인하세요
          </p>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          일반 고객이신가요?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            고객 로그인
          </Link>
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          아직 업체 회원이 아니신가요?{' '}
          <Link href="/contractor-signup" className="font-medium text-emerald-600 hover:text-green-500">
            업체 회원가입
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* 오류 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-emerald-600 hover:text-green-500">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    로그인 중...
                  </>
                ) : (
                  '업체 로그인'
                )}
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Google 로그인 */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.05-4.33 1.05-3.31 0-6.12-2.23-7.12-5.24H.8v2.86A11.93 11.93 0 0012 23z"
                  />
                  <path
                    fill="#FBBC04"
                    d="M4.88 14.09A7.31 7.31 0 014.5 12c0-.73.13-1.45.38-2.09V7.05H.8A11.93 11.93 0 000 12c0 1.92.46 3.73 1.28 5.33l3.6-2.79z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.76c1.86 0 3.53.64 4.85 1.9l3.64-3.64A11.86 11.86 0 0012 0 11.93 11.93 0 00.8 7.05l3.6 2.79c1-3.01 3.81-5.08 7.12-5.08z"
                  />
                </svg>
                Google로 로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
