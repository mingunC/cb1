'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Users, FileText, Calendar, Settings, LogOut, FolderOpen, Image } from 'lucide-react'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState({
    pendingQuotes: 0,
    totalContractors: 0,
    monthlyQuotes: 0
  })
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    
    const checkUser = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!isMounted) return
        
        console.log('Checking user in admin page:', user?.email)
        
        if (error) {
          console.error('Auth error:', error)
          if (isMounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }
        
        if (!user) {
          console.log('No user found, redirecting to login')
          if (isMounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }

        if (isMounted) {
          setUser(user)
          
          // cmgg919@gmail.com만 허용
          if (user.email === 'cmgg919@gmail.com') {
            console.log('✅ Admin access granted for:', user.email)
            setIsAuthorized(true)
            setIsLoading(false)
            // 통계 데이터 가져오기
            await fetchStats()
          } else {
            console.log('❌ Access denied for:', user.email)
            setIsAuthorized(false)
            setIsLoading(false)
            // 즉시 리다이렉트
            router.push('/')
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        if (isMounted) {
          setIsLoading(false)
          router.push('/login')
        }
      }
    }

    checkUser()
    
    return () => {
      isMounted = false
    }
  }, [router])

  const fetchStats = async () => {
    try {
      const supabase = createBrowserClient()
      
      // 대기 중인 견적 수
      const { count: pendingCount } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      // 등록된 업체 수
      const { count: contractorCount } = await supabase
        .from('contractors')
        .select('*', { count: 'exact', head: true })
      
      // 이번 달 견적 수 (모든 견적 요청)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const { count: monthlyCount } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
      
      setStats({
        pendingQuotes: pendingCount || 0,
        totalContractors: contractorCount || 0,
        monthlyQuotes: monthlyCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // 권한이 없을 때
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const adminMenuItems = [
    {
      title: '견적 요청 관리',
      description: '고객의 견적 요청을 검토하고 승인합니다',
      icon: FileText,
      href: '/admin/quotes',
      color: 'bg-blue-500'
    },
    {
      title: '프로젝트 관리',
      description: '승인된 프로젝트와 현장방문을 관리합니다',
      icon: FolderOpen,
      href: '/admin/projects',
      color: 'bg-orange-500'
    },
    {
      title: '업체 관리',
      description: '전문 업체들을 관리하고 검증합니다',
      icon: Users,
      href: '/admin/contractors',
      color: 'bg-green-500'
    },
    {
      title: '포트폴리오 관리',
      description: '업체 포트폴리오를 관리하고 검증합니다',
      icon: Image,
      href: '/admin/portfolio',
      color: 'bg-indigo-500'
    },
    {
      title: '이벤트 관리',
      description: '플랫폼 이벤트를 생성하고 관리합니다',
      icon: Calendar,
      href: '/admin/events',
      color: 'bg-purple-500'
    },
    {
      title: '시스템 설정',
      description: '플랫폼 설정을 관리합니다',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                홈으로
              </button>
              <h1 className="text-xl font-semibold text-gray-900">관리자 대시보드</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">관리자 대시보드</h2>
          <p className="text-gray-600">플랫폼을 관리하고 모니터링하세요</p>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminMenuItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-center mb-4">
                  <div className={`${item.color} rounded-lg p-3 mr-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* 통계 카드 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">대기 중인 견적</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.pendingQuotes}</p>
            <p className="text-sm text-gray-600">검토 필요</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 업체</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalContractors}</p>
            <p className="text-sm text-gray-600">활성 업체</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">이번 달 견적</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.monthlyQuotes}</p>
            <p className="text-sm text-gray-600">이번 달 견적 요청</p>
          </div>
        </div>
      </div>
    </div>
  )
}