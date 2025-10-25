'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  user_type: 'customer' | 'admin' | 'contractor'
  first_name?: string
  last_name?: string
}

interface ContractorProfile {
  company_name: string
  contact_name: string
}

interface UserContextType {
  user: User | null
  userProfile: UserProfile | null
  contractorProfile: ContractorProfile | null
  isContractor: boolean
  isAdmin: boolean
  displayName: string
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const loadUserData = async () => {
    try {
      const supabase = createBrowserClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setIsLoading(false)
        return
      }

      setUser(session.user)
      await loadUserProfile(session.user.id, session.user.email)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string, email?: string | null) => {
    try {
      const supabase = createBrowserClient()
      
      // 1. 먼저 업체인지 확인
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('company_name, contact_name')
        .eq('user_id', userId)
        .maybeSingle()

      if (contractorData) {
        setContractorProfile(contractorData)
        setUserProfile(null)
        const finalDisplayName = contractorData.company_name || contractorData.contact_name || email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'contractor')
        return
      }

      // 2. 일반 사용자 정보 확인
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, first_name, last_name')
        .eq('id', userId)
        .maybeSingle()

      if (userData) {
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
        
        const finalDisplayName = isValidName ? fullName : email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', userData.user_type)
      } else {
        // 기본값 설정
        setUserProfile({ user_type: 'customer' })
        setContractorProfile(null)
        const finalDisplayName = email?.split('@')[0] || 'User'
        setDisplayName(finalDisplayName)
        
        // localStorage에 캐시 저장
        localStorage.setItem('cached_user_name', finalDisplayName)
        localStorage.setItem('cached_user_type', 'customer')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      if (email) {
        setDisplayName(email.split('@')[0])
      }
    }
  }

  useEffect(() => {
    // 초기 로드
    loadUserData()

    // Auth 상태 변경 리스너
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id, session.user.email)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setContractorProfile(null)
          setDisplayName('')
          localStorage.removeItem('cached_user_name')
          localStorage.removeItem('cached_user_type')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isContractor = !!contractorProfile
  const isAdmin = userProfile?.user_type === 'admin'

  return (
    <UserContext.Provider
      value={{
        user,
        userProfile,
        contractorProfile,
        isContractor,
        isAdmin,
        displayName,
        isLoading,
        refreshUser: loadUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
