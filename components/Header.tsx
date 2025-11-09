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
  company_logo?: string
}

// Execute immediately on page load (outside useEffect)
const getCachedUserName = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cached_user_name') || ''
  }
  return ''
}

// Execute immediately on page load (outside useEffect)
const getCachedUserType = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cached_user_type') || ''
  }
  return ''
}

// ✅ Global cache for image load status (prevents duplicate failures)
const imageLoadCache = new Map<string, boolean>()

// ✅ User Avatar Component - 업체는 로고 또는 업체명 이니셜만 표시
const UserAvatar = ({ 
  user, 
  displayName,
  contractorProfile,
  size = 'md' 
}: { 
  user: any
  displayName: string
  contractorProfile?: ContractorProfile | null
  size?: 'sm' | 'md' | 'lg'
}) => {
  // Get avatar URL - 업체는 company_logo만, 일반 유저는 Google 이미지
  const getAvatarUrl = () => {
    if (contractorProfile) {
      // ✅ Contractor: company logo ONLY (구글 이미지 사용 안 함)
      if (contractorProfile.company_logo) {
        return contractorProfile.company_logo
      }
      return null  // 로고 없으면 null 반환 -> 업체명 이니셜 표시
    } else {
      // Regular user: Google profile image
      return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
    }
  }

  const avatarUrl = getAvatarUrl()
  
  // ✅ Check global cache - 이전에 실패한 이미지는 바로 이니셜로
  const getInitialLoadState = () => {
    if (!avatarUrl) return false
    
    const cachedStatus = imageLoadCache.get(avatarUrl)
    if (cachedStatus === false) {
      // 이전에 실패했던 이미지는 바로 false 반환
      return false
    }
    
    // 캐시에 없거나 성공했던 이미지는 true로 시작 (이미지 먼저 시도)
    return true
  }
  
  const [imageLoaded, setImageLoaded] = useState(getInitialLoadState())
  
  // Reset when avatarUrl changes
  useEffect(() => {
    if (avatarUrl) {
      const cached = imageLoadCache.get(avatarUrl)
      if (cached === false) {
        // 이전에 실패한 이미지
        setImageLoaded(false)
      } else {
        // 새 이미지 또는 성공했던 이미지 - 이미지 먼저 시도
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(false)
    }
  }, [avatarUrl])

  // ✅ Get initials - 업체는 업체명 기반, 일반 유저는 이름 기반
  const getInitials = () => {
    // Contractor: 업체명으로 이니셜 생성
    if (contractorProfile) {
      const companyName = contractorProfile.company_name || displayName
      if (companyName && companyName !== '...') {
        const parts = companyName.trim().split(' ')
        if (parts.length >= 2) {
          // 두 단어 이상: 첫 단어와 마지막 단어의 첫 글자
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        // 한 단어: 첫 두 글자 또는 첫 글자
        return companyName.substring(0, 2).toUpperCase()
      }
      return 'CO'  // Company의 약자
    }
    
    // Regular user: 이름 또는 이메일로 이니셜 생성
    if (displayName && displayName !== '...') {
      const parts = displayName.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return displayName[0].toUpperCase()
    }
    
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    
    return 'U'
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const bgColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500'
  ]

  // ✅ Get background color - 업체는 업체명 기반, 일반 유저는 이메일 기반
  const getBackgroundColor = () => {
    if (contractorProfile) {
      // Contractor: 업체명 기반으로 색상 선택
      const companyName = contractorProfile.company_name || displayName
      if (companyName) {
        const charCode = companyName.charCodeAt(0)
        return bgColors[charCode % bgColors.length]
      }
      return 'bg-emerald-500'  // 업체 기본 색상
    }
    
    // Regular user: 이메일 기반으로 색상 선택
    if (!user?.email) return bgColors[0]
    const charCode = user.email.charCodeAt(0)
    return bgColors[charCode % bgColors.length]
  }

  // If no avatar URL or image failed to load, show initials
  if (!avatarUrl || !imageLoaded) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold ${getBackgroundColor()}`}
      >
        {getInitials()}
      </div>
    )
  }

  // Try to display profile picture with error handling
  return (
    <img
      src={avatarUrl}
      alt={displayName || 'User'}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
      onError={() => {
        if (process.env.NODE_ENV === 'development') console.log('⚠️ Image failed to load:', avatarUrl)
        // ✅ Cache the failure globally
        if (avatarUrl) {
          imageLoadCache.set(avatarUrl, false)
        }
        setImageLoaded(false)
      }}
      onLoad={() => {
        if (process.env.NODE_ENV === 'development') console.log('✅ Avatar image loaded successfully:', avatarUrl)
        // ✅ Cache the success globally
        if (avatarUrl) {
          imageLoadCache.set(avatarUrl, true)
        }
      }}
    />
  )
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
  
  // Refs for state tracking
  const isMounted = useRef(true)
  const authListenerSetupRef = useRef(false)
  const currentUserId = useRef<string | null>(null)

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
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session?.user) {
        if (isMounted.current) {
          setIsLoading(false)
        }
        
        if (!authListenerSetupRef.current) {
          setupAuthListener()
        }
        return
      }

      if (isMounted.current) {
        setUser(session.user)
        await loadUserProfile(session.user.id, session.user.email)
      }

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
        
        if (event === 'INITIAL_SESSION') return
        
        if (event === 'TOKEN_REFRESHED') {
          if (session?.user && isMounted.current) {
            if (process.env.NODE_ENV === 'development') console.log('🔄 Token refreshed, updating user metadata')
            setUser(session.user)
          }
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          if (currentUserId.current !== session.user.id) {
            if (process.env.NODE_ENV === 'development') console.log('🔄 New user signed in, loading profile')
            setUser(session.user)
            currentUserId.current = null
            await loadUserProfile(session.user.id, session.user.email)
          } else {
            if (process.env.NODE_ENV === 'development') console.log('✅ Same user, updating user object')
            setUser(session.user)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setContractorProfile(null)
          setDisplayName('')
          currentUserId.current = null
          setIsUserDropdownOpen(false)
          // ✅ Clear image cache on logout
          imageLoadCache.clear()
        }
      }
    )
    
    authListenerSetupRef.current = true
  }

  const loadUserProfile = async (userId: string, email?: string | null) => {
    if (currentUserId.current === userId) {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile already loaded for user:', userId)
      return
    }
    
    try {
      const supabase = createBrowserClient()
      
      if (process.env.NODE_ENV === 'development') console.log('🔍 Loading user profile:', { userId, email })
      
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, contact_name, company_logo')
        .eq('user_id', userId)
        .maybeSingle()

      if (process.env.NODE_ENV === 'development') console.log('🔍 Contractors table query result:', { contractorData, error: contractorError })

      if (contractorData && isMounted.current) {
        setContractorProfile(contractorData)
        setUserProfile(null)
        const finalDisplayName = contractorData.company_name || contractorData.contact_name || email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'contractor')
        
        if (process.env.NODE_ENV === 'development') console.log('✅ Identified as contractor:', { finalDisplayName, hasLogo: !!contractorData.company_logo })
        
        currentUserId.current = userId
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type, first_name, last_name')
        .eq('id', userId)
        .maybeSingle()

      if (process.env.NODE_ENV === 'development') console.log('🔍 Users table query result:', { userData, error: userError })

      if (userData && isMounted.current) {
        setUserProfile(userData)
        setContractorProfile(null)
        
        const firstName = userData.first_name || ''
        const lastName = userData.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        const isValidName = fullName && 
                           fullName !== 'User' &&
                           fullName !== 'user' &&
                           firstName !== 'User' &&
                           firstName !== 'user'
        
        const finalDisplayName = isValidName ? fullName : email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', userData.user_type)
        
        if (process.env.NODE_ENV === 'development') console.log('✅ Identified as regular user:', { userData, finalDisplayName })
        
        currentUserId.current = userId
      } else if (isMounted.current) {
        setUserProfile({ user_type: 'customer' })
        setContractorProfile(null)
        const finalDisplayName = email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'customer')
        
        if (process.env.NODE_ENV === 'development') console.log('⚠️ Set to default (customer):', { finalDisplayName })
        
        currentUserId.current = userId
      }
      
    } catch (error) {
      console.error('Error loading profile:', error)
      if (isMounted.current) {
        setDisplayName(email?.split('@')[0] || '')
        currentUserId.current = userId
      }
    }
  }

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
    if (isLoggingOut) {
      if (process.env.NODE_ENV === 'development') console.log('⚠️ Already logging out.')
      return
    }
    
    setIsLoggingOut(true)
    if (process.env.NODE_ENV === 'development') console.log('🚪 Starting logout...')
    
    try {
      setUser(null)
      setUserProfile(null)
      setContractorProfile(null)
      setDisplayName('')
      currentUserId.current = null
      setIsUserDropdownOpen(false)
      if (process.env.NODE_ENV === 'development') console.log('✅ UI state reset complete')
      
      try {
        localStorage.removeItem('cached_user_name')
        localStorage.removeItem('cached_user_type')
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
        if (process.env.NODE_ENV === 'development') console.log('✅ localStorage completely cleared')
      } catch (e) {
        console.error('⚠️ localStorage clear error:', e)
      }
      
      try {
        sessionStorage.clear()
        if (process.env.NODE_ENV === 'development') console.log('✅ sessionStorage cleared')
      } catch (e) {
        console.error('⚠️ sessionStorage clear error:', e)
      }
      
      // ✅ Clear image cache
      imageLoadCache.clear()
      
      const supabase = createBrowserClient()
      await supabase.auth.signOut({ scope: 'local' })
      if (process.env.NODE_ENV === 'development') console.log('✅ Supabase logout complete')
      
      if (process.env.NODE_ENV === 'development') console.log('✅ Force redirect to homepage')
      window.location.replace('/')
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('⚠️ Storage clear error:', e)
      }
      
      window.location.replace('/')
    }
  }

  const isAdmin = userProfile?.user_type === 'admin'
  const isContractor = !!contractorProfile

  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Partners', href: '/pros' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Events', href: '/events' },
    ]

    if (!user) {
      return baseNavigation
    }

    if (isAdmin) {
      return [
        ...baseNavigation,
        { name: 'Admin Dashboard', href: '/admin' },
      ]
    } else {
      return baseNavigation
    }
  }

  const navigation = getNavigation()

  const getDisplayName = () => {
    if (displayName) return displayName
    
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
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Canada Beaver"
                className="h-8 sm:h-10 md:h-12 object-contain w-auto"
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative text-gray-600 hover:text-emerald-700 px-3 py-2 text-sm font-bold transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-amber-50 rounded-lg group hover:shadow-md hover:scale-105"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Buttons based on login status */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User profile button with avatar only */}
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="User menu"
                  >
                    <UserAvatar 
                      user={user} 
                      displayName={getDisplayName()} 
                      contractorProfile={contractorProfile}
                      size="md" 
                    />
                  </button>
                  
                  {/* Dropdown menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <UserAvatar 
                              user={user} 
                              displayName={getDisplayName()} 
                              contractorProfile={contractorProfile}
                              size="md" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {getDisplayName()}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            Admin Dashboard
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
                        {!isAdmin && !isContractor && (
                          <Link
                            href="/my-quotes"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            MyPage
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            if (process.env.NODE_ENV === 'development') console.log('✅ Logout button clicked (dropdown)')
                            setIsUserDropdownOpen(false)
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
                          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Admin badge only */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/contractor-login"
                  className="text-green-600 hover:text-green-700 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-green-300 rounded-lg hover:bg-green-50"
                >
                  Partners Login
                </Link>
              </div>
            )}
            
            {/* Get Quote button - only show if not contractor */}
            {!isContractor && (
              <Link
                href="/quote-request"
                className="text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#bf9b30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a08527'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#bf9b30'}
              >
                Get a Quote
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
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

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-amber-50 block px-3 py-2 text-base font-bold rounded-lg transition-all duration-300 hover:shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* Get Quote button - only show if not contractor */}
              {!isContractor && (
                <div className="pt-4 space-y-2">
                  <Link
                    href="/quote-request"
                    className="text-white block px-3 py-2 rounded-lg text-base font-medium text-center"
                    style={{ backgroundColor: '#bf9b30' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a08527'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#bf9b30'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get a Quote
                  </Link>
                </div>
              )}
              <div className="pt-4 space-y-2">
                {!isLoading && (
                  <>
                    {user ? (
                      <div className="space-y-2">
                        <div className="text-center py-3">
                          {currentUserId.current ? (
                            <div className="flex flex-col items-center space-y-2">
                              <UserAvatar 
                                user={user} 
                                displayName={getDisplayName()} 
                                contractorProfile={contractorProfile}
                                size="lg" 
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {getDisplayName()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 break-words px-2">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-pulse">
                              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                              <div className="h-3 bg-gray-100 rounded w-32 mx-auto"></div>
                            </div>
                          )}
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="block mt-3 bg-red-100 text-red-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-200"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          {isContractor && (
                            <Link
                              href="/contractor"
                              className="block mt-3 bg-green-100 text-green-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-green-200"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              MyPage
                            </Link>
                          )}
                          {!isAdmin && !isContractor && (
                            <Link
                              href="/my-quotes"
                              className="block mt-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-200"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              MyPage
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (process.env.NODE_ENV === 'development') console.log('✅ Logout button clicked (mobile)')
                            setIsMenuOpen(false)
                            handleSignOut()
                          }}
                          disabled={isLoggingOut}
                          className={`flex items-center justify-center px-3 py-2 text-base font-medium w-full rounded-lg ${
                            isLoggingOut 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          href="/login"
                          className="block text-center text-gray-600 hover:text-gray-900 px-3 py-2 text-base font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/contractor-login"
                          className="block text-center text-green-600 hover:text-green-700 px-3 py-2 text-base font-medium border border-green-300 rounded-lg hover:bg-green-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Partners Login
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
