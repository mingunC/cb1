'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogIn, LogOut } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/clients'

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
  
  // 상태 추적을 위한 ref
  const isMounted = useRef(true)
  const profileLoadedRef = useRef(false)
  const authListenerSetupRef = useRef(false)

  useEffect(() => {
    isMounted.current = true
    profileLoadedRef.current = false
    
    loadUserData()
    
    return () => {
      isMounted.current = false
      profileLoadedRef.current = false
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
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          profileLoadedRef.current = false // 프로필 재로드 필요
          await loadUserProfile(session.user.id, session.user.email)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setContractorProfile(null)
          setDisplayName('')
          profileLoadedRef.current = false
          setIsUserDropdownOpen(false)
        }
        // TOKEN_REFRESHED는 무시
      }
    )
    
    authListenerSetupRef.current = true
  }

  const loadUserProfile = async (userId: string, email?: string | null) => {
    // 이미 로드되었으면 스킵
    if (profileLoadedRef.current) return
    
    try {
      const supabase = createBrowserClient()
      
      // 1. 먼저 업체인지 확인
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('company_name, contact_name')
        .eq('user_id', userId)
        .maybeSingle()

      if (contractorData && isMounted.current) {
        setContractorProfile(contractorData)
        setUserProfile(null)
        const finalDisplayName = contractorData.company_name || contractorData.contact_name || email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'contractor')
        
        profileLoadedRef.current = true
        return
      }

      // 2. 일반 사용자 정보 확인
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, first_name, last_name')
        .eq('id', userId)
        .maybeSingle()

      if (userData && isMounted.current) {
        setUserProfile(userData)
        setContractorProfile(null)
        
        // 이름 설정 (유효성 검증 포함)
        const firstName = userData.first_name || ''
        const lastName = userData.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        // 이름이 유효한지 확인
        const isValidName = fullName && 
                           fullName !== 'user user' && 
                           fullName !== 'User' &&
                           firstName !== 'user' &&
                           lastName !== 'user'
        
        const finalDisplayName = isValidName ? fullName : email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', userData.user_type)
        
        profileLoadedRef.current = true
      } else if (isMounted.current) {
        // 기본값 설정
        setUserProfile({ user_type: 'customer' })
        setContractorProfile(null)
        const finalDisplayName = email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'customer')
        
        profileLoadedRef.current = true
      }
      
    } catch (error) {
      console.error('Error loading profile:', error)
      if (isMounted.current) {
        setDisplayName(email?.split('@')[0] || 'User')
        profileLoadedRef.current = true
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
    try {
      console.log('로그아웃 시작...')
      const supabase = createBrowserClient()
      console.log('Supabase 클라이언트 생성됨')
      
      await supabase.auth.signOut()
      console.log('Supabase 로그아웃 완료')
      
      // localStorage 캐시 클리어
      localStorage.removeItem('cached_user_name')
      localStorage.removeItem('cached_user_type')
      console.log('localStorage 캐시 클리어 완료')
      
      setUser(null)
      setUserProfile(null)
      setContractorProfile(null)
      setDisplayName('')
      profileLoadedRef.current = false
      setIsUserDropdownOpen(false)
      console.log('상태 초기화 완료')
      
      router.push('/')
      console.log('홈페이지로 리다이렉트 완료')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // 사용자 역할 확인
  const isAdmin = userProfile?.user_type === 'admin'
  const isContractor = !!contractorProfile

  // 네비게이션 메뉴 설정
  const getNavigation = () => {
    if (isAdmin) {
      return [
        { name: '업체', href: '/pros' },
        { name: '포트폴리오', href: '/portfolio' },
        { name: '이벤트', href: '/events' },
        { name: '관리자 대시보드', href: '/admin' },
      ]
    } else if (isContractor) {
      return [
        { name: '업체', href: '/pros' },
        { name: '포트폴리오', href: '/portfolio' },
        { name: '이벤트', href: '/events' },
        { name: '내견적관리', href: '/contractor' },
      ]
    } else {
      return [
        { name: '업체', href: '/pros' },
        { name: '포트폴리오', href: '/portfolio' },
        { name: '이벤트', href: '/events' },
        { name: '내 견적', href: '/my-quotes' },
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
    
    // 프로필이 로드되지 않았으면 캐시된 이름 반환
    if (!profileLoadedRef.current) {
      const cachedName = getCachedUserName()
      return cachedName || '...'
    }
    
    return user?.email?.split('@')[0] || 'User'
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
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
                            내견적관리
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            console.log('로그아웃 버튼 클릭됨 (드롭다운)')
                            handleSignOut()
                            setIsUserDropdownOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          로그아웃
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
                    업체
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
                  업체 로그인
                </Link>
              </div>
            )}
            
            {/* 견적 요청 버튼 - 맨 오른쪽 */}
            <Link
              href="/quote-request"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              견적 요청
            </Link>
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
              <div className="pt-4 space-y-2">
                <Link
                  href="/quote-request"
                  className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-lg text-base font-medium text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  견적 요청
                </Link>
                {!isLoading && (
                  <>
                    {user ? (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-gray-600 py-2">
                          {profileLoadedRef.current ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {getDisplayName()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{user.email}</div>
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
                              내견적관리
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            console.log('로그아웃 버튼 클릭됨 (모바일)')
                            handleSignOut()
                            setIsMenuOpen(false)
                          }}
                          className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-base font-medium w-full rounded-lg"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          로그아웃
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
                          업체 로그인
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