'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createBrowserClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.',
      })
      setEmail('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || '오류가 발생했습니다. 다시 시도해주세요.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 재설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
              placeholder="이메일 주소"
            />
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
              {loading ? '전송 중...' : '비밀번호 재설정 링크 보내기'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
