'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogIn, LogOut } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'
import toast from 'react-hot-toast'

interface UserProfile {
  user_type: 'customer' | 'admin' | 'contractor'
  first_name?: string
  last_name?: string
}

interface ContractorProfile {
  company_name: string
  contact_name: string
}

// 페이지 로드 시 즉시 실행 (useEffect 밖에서)
const getCachedUserName = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cached_user_name') || ''
  }
  return ''
}

// 페이지 로드 시 즉시 실행 (useEffect 밖에서)
const getCachedUserType = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cached_user_type') || ''
  }
  return ''
}

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>(getCachedUserName())
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // 상태 추적을 위한 ref
  const isMounted = useRef(true)
  const authListenerSetupRef = useRef(false)
  const currentUserId = useRef<string | null>(null) // 현재 로드된 사용자 ID 추적

  useEffect(() => {
    isMounted.current = true
    
    loadUserData()
    
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createBrowserClient()
      
      // 1. 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session?.user) {
        if (isMounted.current) {
          setIsLoading(false)
        }
        
        // 세션이 없을 때만 auth 리스너 설정
        if (!authListenerSetupRef.current) {
          setupAuthListener()
        }
        return
      }

      // 2. 사용자 정보 설정
      if (isMounted.current) {
        setUser(session.user)
        await loadUserProfile(session.user.id, session.user.email)
      }

      // 3. Auth 리스너 설정 (한 번만)
      if (!authListenerSetupRef.current) {
        setupAuthListener()
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  const setupAuthListener = () => {
    if (authListenerSetupRef.current) return
    
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return
        
        // INITIAL_SESSION은 무시 (이미 loadUserData에서 처리)
        if (event === 'INITIAL_SESSION') return
        
        // TOKEN_REFRESHED는 프로필을 다시 로드하지 않음
        if (event === 'TOKEN_REFRESHED') {
          // 토큰만 갱신되고 사용자는 동일하므로 무시
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          currentUserId.current = null // 새 사용자이므로 리셋
          await loadUserProfile(session.user.id, session.user.email)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setContractorProfile(null)
          setDisplayName('')
          currentUserId.current = null
          setIsUserDropdownOpen(false)
        }
      }
    )
    
    authListenerSetupRef.current = true
  }

  const loadUserProfile = async (userId: string, email?: string | null) => {
    // 이미 같은 사용자의 프로필이 로드되었으면 스킵
    if (currentUserId.current === userId) {
      console.log('프로필 이미 로드됨:', userId)
      return
    }
    
    try {
      const supabase = createBrowserClient()
      
      console.log('🔍 사용자 프로필 로드 시작:', { userId, email })
      
      // 1. 먼저 업체인지 확인
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, contact_name')
        .eq('user_id', userId)
        .maybeSingle()

      console.log('🔍 contractors 테이블 조회 결과:', { contractorData, error: contractorError })

      if (contractorData && isMounted.current) {
        setContractorProfile(contractorData)
        setUserProfile(null)
        const finalDisplayName = contractorData.company_name || contractorData.contact_name || email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'contractor')
        
        console.log('✅ 업체로 인식됨:', { finalDisplayName })
        
        currentUserId.current = userId // 로드 완료 표시
        return
      }

      // 2. 일반 사용자 정보 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type, first_name, last_name')
        .eq('id', userId)
        .maybeSingle()

      console.log('🔍 users 테이블 조회 결과:', { userData, error: userError })

      if (userData && isMounted.current) {
        setUserProfile(userData)
        setContractorProfile(null)
        
        // 이름 설정 (Google OAuth: given_name=first_name, family_name=last_name)
        const firstName = userData.first_name || ''
        const lastName = userData.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        // 유효한 이름인지 확인 (빈 문자열이나 기본값 제외)
        const isValidName = fullName && 
                           fullName !== 'User' &&
                           fullName !== 'user' &&
                           firstName !== 'User' &&
                           firstName !== 'user'
        
        const finalDisplayName = isValidName ? fullName : email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', userData.user_type)
        
        console.log('✅ 일반 사용자로 인식됨:', { userData, finalDisplayName })
        
        currentUserId.current = userId // 로드 완료 표시
      } else if (isMounted.current) {
        // 기본값 설정
        setUserProfile({ user_type: 'customer' })
        setContractorProfile(null)
        const finalDisplayName = email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'customer')
        
        console.log('⚠️ 기본값으로 설정됨 (customer):', { finalDisplayName })
        
        currentUserId.current = userId // 로드 완료 표시
      }
      
    } catch (error) {
      console.error('Error loading profile:', error)
      if (isMounted.current) {
        setDisplayName(email?.split('@')[0] || 'User')
        currentUserId.current = userId // 에러가 나도 로드 완료로 표시
      }
    }
  }

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
    if (isLoggingOut) return // 이미 로그아웃 중이면 무시
    
    try {
      setIsLoggingOut(true)
      console.log('🚪 로그아웃 시작...')
      
      // 즉시 UI 상태 초기화 (사용자 경험 개선)
      setUser(null)
      setUserProfile(null)
      setContractorProfile(null)
      setDisplayName('')
      currentUserId.current = null // 사용자 ID 리셋
      setIsUserDropdownOpen(false)
      console.log('✅ UI 상태 즉시 초기화 완료')
      
      const supabase = createBrowserClient()
      console.log('✅ Supabase 클라이언트 생성됨')
      
      // 로그아웃 실행 (타임아웃 추가)
      const logoutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('로그아웃 타임아웃')), 5000)
      )
      
      const { error } = await Promise.race([logoutPromise, timeoutPromise]) as any
      
      if (error) {
        console.error('❌ Supabase 로그아웃 에러:', error)
        // 에러가 있어도 계속 진행 (UI는 이미 초기화됨)
      } else {
        console.log('✅ Supabase 로그아웃 완료')
      }
      
      // localStorage 캐시 클리어
      localStorage.removeItem('cached_user_name')
      localStorage.removeItem('cached_user_type')
      localStorage.removeItem('sb-josdopshblohlcfyrylt-auth-token') // Supabase 토큰도 제거
      console.log('✅ localStorage 캐시 클리어 완료')
      
      // 강제 페이지 리로드 (확실한 로그아웃)
      console.log('✅ 강제 페이지 리로드 실행')
      window.location.href = '/'
      
    } catch (error) {
      console.error('❌ 로그아웃 에러:', error)
      
      // 에러가 발생해도 상태는 초기화
      setUser(null)
      setUserProfile(null)
      setContractorProfile(null)
      setDisplayName('')
      currentUserId.current = null
      setIsUserDropdownOpen(false)
      
      // localStorage 캐시 클리어
      localStorage.removeItem('cached_user_name')
      localStorage.removeItem('cached_user_type')
      localStorage.removeItem('sb-josdopshblohlcfyrylt-auth-token')
      
      // 강제 페이지 리로드
      window.location.href = '/'
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 사용자 역할 확인
  const isAdmin = userProfile?.user_type === 'admin'
  const isContractor = !!contractorProfile

  // 네비게이션 메뉴 설정
  const getNavigation = () => {
    // 기본 메뉴 (로그인 여부와 무관하게 항상 표시)
    const baseNavigation = [
      { name: 'Pros', href: '/pros' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Event', href: '/events' },
    ]

    // 로그인하지 않은 경우 - MyPage 없이 기본 메뉴만
    if (!user) {
      return baseNavigation
    }

    // 로그인한 경우 - 역할에 따라 MyPage 추가
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
      // 일반 고객
      return [
        ...baseNavigation,
        { name: 'MyPage', href: '/my-quotes' },
      ]
    }
  }

  const navigation = getNavigation()

  // 표시할 이름 가져오기
  const getDisplayName = () => {
    // 캐시된 이름이 있으면 즉시 반환 (깜빡임 방지)
    if (displayName) return displayName
    
    // 로딩 중이면 캐시된 이름 반환
    if (isLoading) {
      const cachedName = getCachedUserName()
      return cachedName || '...'
    }
    
    return user?.email?.split('@')[0] || ''
  }

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
                      {getDisplayName()}
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
                            setIsUserDropdownOpen(false)
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
                          {currentUserId.current ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {getDisplayName()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 break-words px-2">{user.email}</div>
                            </>
                          ) : (
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                              <div className="h-3 bg-gray-100 rounded w-32 mx-auto"></div>
                            </div>
                          )}
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
