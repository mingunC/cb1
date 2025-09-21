'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase/clients'
import { toast } from 'react-hot-toast'

interface FormData {
  email: string
  password: string
}

export default function ContractorLoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
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
      toast.success(`${result.contractorData?.company_name} 계정으로 로그인되었습니다`)
      router.push('/contractor')
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=contractor`
        }
      })

      if (googleError) {
        setError('Google 로그인에 실패했습니다.')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Google 로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>
        
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            업체 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            전문 업체 계정으로 로그인하세요
          </p>
        </div>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          일반 고객이신가요?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            고객 로그인
          </Link>
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          아직 업체 회원이 아니신가요?{' '}
          <Link href="/contractor-signup" className="font-medium text-green-600 hover:text-green-500">
            업체 회원가입
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="your@email.com"
                />
              </div>
            </div>

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
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-500">
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 22.56c3.25 0 5.92-1.09 7.9-2.96l-3.57-2.77c-.98.64-2.23 1.05-4.33 1.05-3.06 0-5.66-2.07-6.6-4.86H1.85v2.83c1.92 3.77 5.79 6.33 10.15 6.33z" />
                <path fill="#FBBC04" d="M5.35 14.05c-.1-.3-.16-.62-.16-.97s.06-.68.16-.97V9.25H1.85c-.36.72-.56 1.57-.56 2.49s.2 1.77.56 2.49l3.5-2.7z" />
                <path fill="#EA4335" d="M12 5.64c1.92 0 3.45.8 4.23 1.55L20.5 2.93C18.42 1.01 15.75 0 12 0 7.64 0 3.77 2.56 1.85 6.33l3.5 2.7c.94-2.79 3.54-4.86 6.6-4.86z" />
              </svg>
              Google로 로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
