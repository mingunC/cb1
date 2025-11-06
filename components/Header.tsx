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
  const currentUserId = useRef<string | null>(null) // Track currently loaded user ID

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
      
      // 1. Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session?.user) {
        if (isMounted.current) {
          setIsLoading(false)
        }
        
        // Set up auth listener only when there's no session
        if (!authListenerSetupRef.current) {
          setupAuthListener()
        }
        return
      }

      // 2. Set user info
      if (isMounted.current) {
        setUser(session.user)
        await loadUserProfile(session.user.id, session.user.email)
      }

      // 3. Set up auth listener (only once)
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
        
        // Ignore INITIAL_SESSION (already handled in loadUserData)
        if (event === 'INITIAL_SESSION') return
        
        // Don't reload profile on TOKEN_REFRESHED
        if (event === 'TOKEN_REFRESHED') {
          // Only token refreshed, user is the same so ignore
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          currentUserId.current = null // Reset for new user
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
    // Skip if profile for same user is already loaded
    if (currentUserId.current === userId) {
      console.log('Profile already loaded:', userId)
      return
    }
    
    try {
      const supabase = createBrowserClient()
      
      console.log('🔍 Loading user profile:', { userId, email })
      
      // 1. First check if contractor
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('company_name, contact_name')
        .eq('user_id', userId)
        .maybeSingle()

      console.log('🔍 Contractors table query result:', { contractorData, error: contractorError })

      if (contractorData && isMounted.current) {
        setContractorProfile(contractorData)
        setUserProfile(null)
        const finalDisplayName = contractorData.company_name || contractorData.contact_name || email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        // Cache in localStorage
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'contractor')
        
        console.log('✅ Identified as contractor:', { finalDisplayName })
        
        currentUserId.current = userId // Mark as loaded
        return
      }

      // 2. Check general user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_type, first_name, last_name')
        .eq('id', userId)
        .maybeSingle()

      console.log('🔍 Users table query result:', { userData, error: userError })

      if (userData && isMounted.current) {
        setUserProfile(userData)
        setContractorProfile(null)
        
        // Set name (Google OAuth: given_name=first_name, family_name=last_name)
        const firstName = userData.first_name || ''
        const lastName = userData.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        // Check if valid name (exclude empty strings or default values)
        const isValidName = fullName && 
                           fullName !== 'User' &&
                           fullName !== 'user' &&
                           firstName !== 'User' &&
                           firstName !== 'user'
        
        const finalDisplayName = isValidName ? fullName : email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        // Cache in localStorage
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', userData.user_type)
        
        console.log('✅ Identified as regular user:', { userData, finalDisplayName })
        
        currentUserId.current = userId // Mark as loaded
      } else if (isMounted.current) {
        // Set default values
        setUserProfile({ user_type: 'customer' })
        setContractorProfile(null)
        const finalDisplayName = email?.split('@')[0] || ''
        setDisplayName(finalDisplayName)
        
        // Cache in localStorage
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'customer')
        
        console.log('⚠️ Set to default (customer):', { finalDisplayName })
        
        currentUserId.current = userId // Mark as loaded
      }
      
    } catch (error) {
      console.error('Error loading profile:', error)
      if (isMounted.current) {
        setDisplayName(email?.split('@')[0] || '')
        currentUserId.current = userId // Mark as loaded even on error
      }
    }
  }

  // Handle clicks outside dropdown
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

  // ✅ Final improved logout function - force immediate completion
  const handleSignOut = async () => {
    if (isLoggingOut) {
      console.log('⚠️ Already logging out.')
      return // Prevent double clicks
    }
    
    setIsLoggingOut(true)
    console.log('🚪 Starting logout...')
    
    try {
      // ✅ Step 1: Immediately reset UI state
      setUser(null)
      setUserProfile(null)
      setContractorProfile(null)
      setDisplayName('')
      currentUserId.current = null
      setIsUserDropdownOpen(false)
      console.log('✅ UI state reset complete')
      
      // ✅ Step 2: Complete localStorage clear
      try {
        localStorage.removeItem('cached_user_name')
        localStorage.removeItem('cached_user_type')
        // Clear all Supabase-related cache
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
        console.log('✅ localStorage completely cleared')
      } catch (e) {
        console.error('⚠️ localStorage clear error:', e)
      }
      
      // ✅ Step 3: Clear sessionStorage too
      try {
        sessionStorage.clear()
        console.log('✅ sessionStorage cleared')
      } catch (e) {
        console.error('⚠️ sessionStorage clear error:', e)
      }
      
      // ✅ Step 4: Supabase logout (wait synchronously)
      const supabase = createBrowserClient()
      await supabase.auth.signOut({ scope: 'local' })
      console.log('✅ Supabase logout complete')
      
      // ✅ Step 5: Force page reload immediately (ignore cache)
      console.log('✅ Force redirect to homepage')
      window.location.replace('/')
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      // Even on error, force logout
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('⚠️ Storage clear error:', e)
      }
      
      // Force redirect
      window.location.replace('/')
    }
  }

  // Check user role
  const isAdmin = userProfile?.user_type === 'admin'
  const isContractor = !!contractorProfile

  // Set navigation menu
  const getNavigation = () => {
    // Base menu (always displayed regardless of login status)
    const baseNavigation = [
      { name: 'Partners', href: '/pros' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Events', href: '/events' },
    ]

    // If not logged in - only base menu without MyPage
    if (!user) {
      return baseNavigation
    }

    // If logged in - add MyPage based on role
    if (isAdmin) {
      return [
        ...baseNavigation,
        { name: 'Admin Dashboard', href: '/admin' },
      ]
    } else if (isContractor) {
      return [
        ...baseNavigation,
        { name: 'MyPage', href: '/contractor' },
      ]
    } else {
      // Regular customer
      return [
        ...baseNavigation,
        { name: 'MyPage', href: '/my-quotes' },
      ]
    }
  }

  const navigation = getNavigation()

  // Get display name
  const getDisplayName = () => {
    // Return cached name immediately if available (prevent flickering)
    if (displayName) return displayName
    
    // If loading, return cached name
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
                {/* User name dropdown */}
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
                  
                  {/* Dropdown menu */}
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
                        <button
                          onClick={() => {
                            console.log('✅ Logout button clicked (dropdown)')
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
                
                {/* Role badge */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {isContractor && (
                  <Link
                    href="/contractor"
                    className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Partners
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
                              Admin Dashboard
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
                            console.log('✅ Logout button clicked (mobile)')
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
