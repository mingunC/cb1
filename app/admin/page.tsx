'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Users, FileText, Settings, LogOut, Image, TrendingUp, Clock, CheckCircle, Gift } from 'lucide-react'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState({
    pendingQuotes: 0,
    totalContractors: 0,
    monthlyQuotes: 0,
    activeProjects: 0,
    completedProjects: 0,
    activeEvents: 0
  })
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    
    const checkUser = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!isMounted) return
        
        if (error || !user) {
          if (isMounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }

        if (isMounted) {
          setUser(user)
          
          if (user.email === 'cmgg919@gmail.com') {
            setIsAuthorized(true)
            setIsLoading(false)
            fetchStats()
          } else {
            setIsAuthorized(false)
            setIsLoading(false)
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
      
      const [
        pendingResult,
        contractorResult,
        monthlyResult,
        activeResult,
        completedResult,
        eventsResult
      ] = await Promise.all([
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contractors').select('*', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).in('status', ['site-visit-pending', 'site-visit-completed', 'bidding']),
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])
      
      setStats({
        pendingQuotes: pendingResult.count || 0,
        totalContractors: contractorResult.count || 0,
        monthlyQuotes: monthlyResult.count || 0,
        activeProjects: activeResult.count || 0,
        completedProjects: completedResult.count || 0,
        activeEvents: eventsResult.count || 0
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

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
      color: 'bg-blue-500',
      stats: `${stats.pendingQuotes}개 대기중`
    },
    {
      title: '업체 관리',
      description: '전문 업체들을 관리하고 검증합니다',
      icon: Users,
      href: '/admin/contractors',
      color: 'bg-green-500',
      stats: `${stats.totalContractors}개 업체`
    },
    {
      title: '이벤트 관리',
      description: '프로모션 및 이벤트를 관리합니다',
      icon: Gift,
      href: '/admin/events',
      color: 'bg-pink-500',
      stats: `${stats.activeEvents}개 진행중`
    },
    {
      title: '포트폴리오 관리',
      description: '업체 포트폴리오를 관리하고 검증합니다',
      icon: Image,
      href: '/admin/portfolio',
      color: 'bg-indigo-500',
      stats: '검증 필요'
    },
    {
      title: '시스템 설정',
      description: '플랫폼 설정을 관리합니다',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      stats: '관리'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                홈으로
              </button>
              <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">환영합니다! 👋</h2>
          <p className="text-gray-600">플랫폼 현황을 확인하고 관리하세요</p>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-semibold text-yellow-600">대기중</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingQuotes}</p>
            <p className="text-sm text-gray-600">대기 중인 견적</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-600">진행중</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.activeProjects}</p>
            <p className="text-sm text-gray-600">활성 프로젝트</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600">완료</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.completedProjects}</p>
            <p className="text-sm text-gray-600">완료된 프로젝트</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-purple-600">업체</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalContractors}</p>
            <p className="text-sm text-gray-600">등록된 업체</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-indigo-600">이번달</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.monthlyQuotes}</p>
            <p className="text-sm text-gray-600">월간 견적</p>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">빠른 메뉴</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {adminMenuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                  onClick={() => router.push(item.href)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${item.color} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {item.stats}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
