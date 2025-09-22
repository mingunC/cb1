'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function TestPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient()
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Session Error: ${sessionError.message}`)
        }
        
        // 현재 사용자 확인
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(prev => `${prev}\nUser Error: ${userError.message}`)
        }
        
        setSessionInfo({
          hasSession: !!session,
          sessionData: session,
          user: user,
          localStorage: Object.keys(localStorage).filter(key => key.includes('supabase')),
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        })
      } catch (err: any) {
        setError(`Unexpected Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])
  
  const handleTestLogin = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'micks1@me.com',
        password: prompt('Enter password for micks1@me.com:') || ''
      })
      
      if (error) {
        alert(`Login Error: ${error.message}`)
      } else {
        alert('Login successful! Refreshing page...')
        window.location.reload()
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }
  
  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      alert('Logged out! Refreshing page...')
      window.location.reload()
    } catch (err: any) {
      alert(`Logout Error: ${err.message}`)
    }
  }
  
  if (loading) {
    return <div className="p-8">Loading...</div>
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Session Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <pre>{error}</pre>
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Session Info:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={handleTestLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Login (micks1@me.com)
        </button>
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Refresh Page
        </button>
      </div>
      
      <div className="mt-6">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <ul className="text-sm space-y-1">
          <li>Current URL: {window.location.href}</li>
          <li>LocalStorage Keys: {Object.keys(localStorage).join(', ')}</li>
          <li>Cookies: {document.cookie || 'None'}</li>
        </ul>
      </div>
    </div>
  )
}
