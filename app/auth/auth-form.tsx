'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { toast } from 'react-hot-toast'

interface AuthFormProps {
  authType: 'login' | 'signup'
}

export default function AuthForm({ authType }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      if (authType === 'login') {
        // ✅ 새로운 auth.ts의 signIn 함수 사용
        const result = await signIn({ email, password })
        
        // ✅ result.success로 성공/실패 확인
        if (!result.success) {
          setError(result.error || '로그인에 실패했습니다.')
          return
        }

        // ✅ 로그인 성공 처리
        console.log('Login successful, redirecting...')
        
        // ✅ 사용자 타입별 맞춤 토스트 메시지
        if (result.userType === 'contractor' && result.contractorData) {
          toast.success(`${result.contractorData.company_name} 계정으로 로그인되었습니다`)
        } else if (result.userType === 'admin') {
          toast.success('관리자 계정으로 로그인되었습니다')
        } else {
          toast.success('로그인되었습니다')
        }
        
        // ✅ result.redirectTo 사용하여 자동 리다이렉트
        router.push(result.redirectTo || '/')
        
      } else {
        // 회원가입 로직 (기존대로 유지)
        setError('회원가입 기능은 별도 페이지에서 이용해주세요.')
      }
      
    } catch (error: any) {
      console.error('Submit error:', error)
      setError('예상치 못한 오류가 발생했습니다.')
    } finally {
      // ✅ 에러 발생 시에만 로딩 해제 (성공 시 리다이렉트로 페이지 이동)
      if (error) {
        setIsLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 이메일 입력 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="your@email.com"
          required
        />
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="••••••••"
          required
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            로그인 중...
          </>
        ) : (
          authType === 'login' ? '로그인' : '회원가입'
        )}
      </button>
    </form>
  )
}
