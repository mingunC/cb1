'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { useUser } from '@/contexts/UserContext'

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // UserContext에서 사용자 정보 가져오기
  const { 
    user, 
    isContractor, 
    isAdmin, 
    displayName, 
    isLoading 
  } = useUser()

  // 드롭다운 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isUserDropdownOpen && !target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  const handleSignOut = async () => {
    if (isLoggingOut) return
    
    try {
      setIsLoggingOut(true)
      console.log('🚪 로그아웃 시작...')
      
      setIsUserDropdownOpen(false)
      console.log('✅ UI 상태 즉시 초기화 완료')
      
      const supabase = createBrowserClient()
      console.log('✅ Supabase 클라이언트 생성됨')
      
      const logoutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('로그아웃 타임아웃')), 5000)
      )
      
      const { error } = await Promise.race([logoutPromise, timeoutPromise]) as any
      
      if (error) {
        console.error('❌ Supabase 로그아웃 에러:', error)
      } else {
        console.log('✅ Supabase 로그아웃 완료')
      }
      
      // localStorage 캐시 클리어
      localStorage.removeItem('cached_user_name')
      localStorage.removeItem('cached_user_type')
      localStorage.removeItem('sb-josdopshblohlcfyrylt-auth-token')
      console.log('✅ localStorage 캐시 클리어 완료')
      
      console.log('✅ 강제 페이지 리로드 실행')
      window.location.href = '/'
      
    } catch (error) {
      console.error('❌ 로그아웃 에러:', error)
      
      localStorage.removeItem('cached_user_name')
      localStorage.removeItem('cached_user_type')
      localStorage.removeItem('sb-josdopshblohlcfyrylt-auth-token')
      
      window.location.href = '/'
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 네비게이션 메뉴 설정
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Pros', href: '/pros' },
      { name: '포트폴리오', href: '/portfolio' },
      { name: '이벤트', href: '/events' },
    ]

    if (!user) {
      return baseNavigation
    }

    if (isAdmin) {
      return [
        ...baseNavigation,
        { name: '관리자 대시보드', href: '/admin' },
      ]
    } else if (isContractor) {
      return [
        ...baseNavigation,
        { name: 'MyPage', href: '/contractor' },
      ]
    } else {
      return [
        ...baseNavigation,
        { name: 'MyPage', href: '/my-quotes' },
      ]
    }
  }

  const navigation = getNavigation()

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Renovation
              </span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 로그인 상태에 따른 버튼 표시 */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* 사용자 이름 드롭다운 */}
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {isLoading ? '...' : displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                  
                  {/* 드롭다운 메뉴 */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 break-words">
                          {user.email}
                        </div>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            관리자 대시보드
                          </Link>
                        )}
                        {isContractor && (
                          <Link
                            href="/contractor"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            MyPage
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            console.log('로그아웃 버튼 클릭됨 (드롭다운)')
                            handleSignOut()
                          }}
                          disabled={isLoggingOut}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                            isLoggingOut 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 역할 배지 */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                  >
                    관리자
                  </Link>
                )}
                {isContractor && (
                  <Link
                    href="/contractor"
                    className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Pros
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  로그인
                </Link>
                <Link
                  href="/contractor-login"
                  className="text-green-600 hover:text-green-700 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-green-300 rounded-lg hover:bg-green-50"
                >
                  Pros 로그인
                </Link>
              </div>
            )}
            
            {/* 견적 요청 버튼 - 업체가 아닐 때만 표시 */}
            {!isContractor && (
              <Link
                href="/quote-request"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                견적 요청
              </Link>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* 견적 요청 버튼 - 업체가 아닐 때만 표시 */}
              {!isContractor && (
                <div className="pt-4 space-y-2">
                  <Link
                    href="/quote-request"
                    className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-lg text-base font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    견적 요청
                  </Link>
                </div>
              )}
              <div className="pt-4 space-y-2">
                {!isLoading && (
                  <>
                    {user ? (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-gray-600 py-2">
                          <div className="font-medium text-gray-900">
                            {displayName || user.email?.split('@')[0] || 'User'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 break-words px-2">{user.email}</div>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="block mt-2 bg-red-100 text-red-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-200"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              관리자 대시보드
                            </Link>
                          )}
                          {isContractor && (
                            <Link
                              href="/contractor"
                              className="block mt-2 bg-green-100 text-green-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-200"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              MyPage
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            console.log('로그아웃 버튼 클릭됨 (모바일)')
                            handleSignOut()
                            setIsMenuOpen(false)
                          }}
                          disabled={isLoggingOut}
                          className={`flex items-center justify-center px-3 py-2 text-base font-medium w-full rounded-lg ${
                            isLoggingOut 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          href="/login"
                          className="block text-center text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          로그인
                        </Link>
                        <Link
                          href="/contractor-login"
                          className="block text-center text-green-600 hover:text-green-700 px-3 py-2 text-base font-medium border border-green-300 rounded-lg hover:bg-green-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Pros 로그인
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
