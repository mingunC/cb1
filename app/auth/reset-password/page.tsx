'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Check if this is a password reset session
      if (session?.user?.aud === 'authenticated') {
        setIsValidSession(true)
      } else {
        setMessage({
          type: 'error',
          text: '유효하지 않은 세션입니다. 비밀번호 재설정 링크를 다시 요청해주세요.',
        })
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate passwords
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '비밀번호가 일치하지 않습니다.',
      })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: '비밀번호는 최소 6자 이상이어야 합니다.',
      })
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: '비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다...',
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || '오류가 발생했습니다. 다시 시도해주세요.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession && message?.type !== 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">세션 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        {isValidSession ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">
                  새 비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="새 비밀번호 (최소 6자)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호 확인"
                />
              </div>
            </div>

            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4">
            {message && message.type === 'error' && (
              <div className="rounded-md p-4 bg-red-50 text-red-800">
                <p className="text-sm">{message.text}</p>
              </div>
            )}
            <Link
              href="/forgot-password"
              className="inline-block font-medium text-orange-600 hover:text-orange-500"
            >
              비밀번호 재설정 링크 다시 요청하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
