'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // 프로젝트 관리가 견적 관리로 통합되었으므로 리다이렉트
    router.replace('/admin/quotes')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">견적 관리 페이지로 이동 중...</p>
      </div>
    </div>
  )
}
