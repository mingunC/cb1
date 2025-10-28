'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { signIn, getCurrentUser } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

// 타입 정의
interface FormData {
  email: string
  password: string
}

interface LoginError {
  message: string
  code?: string
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  
  // 상태 관리
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })

  // 세션 체크 및 자동 리다이렉트
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Existing session found:', session.user.email)
          
          // 새로운 auth.ts의 getCurrentUser 함수 사용
          const userInfo = await getCurrentUser()
          
          if (userInfo.user && userInfo.userType) {
            // 사용자 타입별 리다이렉트 (현재 프로젝트 구조에 맞게)
            let redirectTo = '/'
            
            if (userInfo.userType === 'admin') {
              redirectTo = '/admin'
              toast.success('관리자 계정으로 로그인되었습니다')
            } else if (userInfo.userType === 'contractor' && userInfo.contractorData) {
              redirectTo = '/contractor'
              toast.success(`${userInfo.contractorData.company_name} 계정으로 로그인되었습니다`)
            } else {
              redirectTo = '/'
              toast.success('로그인되었습니다')
            }
            
            console.log(`Redirecting ${userInfo.userType} to: ${redirectTo}`)
            router.push(redirectTo)
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        // 에러 발생 시 조용히 처리 (로그인 페이지 그대로 유지)
      }
    }

    checkExistingSession()
  }, [router, supabase]) // dependency array 추가


  // 로그인 처리
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
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

    try {
      // 새로운 통합 로그인 함수 사용
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공
      console.log('Login successful:', result.user?.email)
      
      if (result.userType === 'contractor' && result.contractorData) {
        toast.success(`${result.contractorData.company_name} 계정으로 로그인되었습니다`)
      } else {
        toast.success('로그인되었습니다')
      }
      
      // 사용자 타입별 리다이렉트 (성공 시 로딩 상태 유지)
      router.push(result.redirectTo || '/')

    } catch (error: any) {
      console.error('Unexpected error during login:', error)
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setIsLoading(false)
    }
  }, [formData, router])

  // Google 로그인 처리
  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (googleError) {
        console.error('Google login error:', googleError)
        setError('Google 로그인에 실패했습니다.')
        toast.error('Google 로그인에 실패했습니다')
      }
      // Google OAuth는 리다이렉트 방식이므로 성공 시 setIsLoading(false) 호출하지 않음
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Google 로그인 중 오류가 발생했습니다.')
      toast.error('Google 로그인 중 오류가 발생했습니다')
    } finally {
      // Google OAuth 에러 발생 시에만 로딩 상태 해제 (성공 시는 리다이렉트로 페이지 이동)
      if (googleError || error) {
        setIsLoading(false)
      }
    }
  }, [supabase])

  // 입력 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 입력 시 에러 메시지 제거
    if (error) setError('')
  }, [error])

  // 비밀번호 표시 토글
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 뒤로가기 버튼 - 위치 개선 */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
                <span>Back to Home</span>
          </Link>
        </div>

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Customer Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Not a member yet?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* 에러 메시지 */}
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
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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

            {/* 추가 옵션 */}
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
                  Remember me
                </label>
              </div>

              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* Google 로그인 */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.05-4.71 1.05-3.62 0-6.69-2.44-7.79-5.72H.65v2.86C2.36 19.08 5.89 23 12 23z" />
                <path fill="#FBBC05" d="M4.21 14.28c-.28-.82-.44-1.69-.44-2.61 0-.92.16-1.79.44-2.61V6.2H.65C.24 7.01 0 7.99 0 9s.24 1.99.65 2.8l3.56 2.48z" />
                <path fill="#EA4335" d="M12 4.75c2.04 0 3.87.7 5.31 2.07l3.99-3.99C19.46 1.09 16.97 0 12 0 5.89 0 2.36 3.92.65 6.2l3.56 2.48C5.31 7.19 8.38 4.75 12 4.75z" />
              </svg>
              Google로 로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}