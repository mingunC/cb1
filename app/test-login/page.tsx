'use client'

import { createBrowserClient } from '@/lib/supabase/clients'
import { useState, useEffect } from 'react'

export default function TestLogin() {
  const [origin, setOrigin] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setOrigin(window.location.origin)
    setDebugInfo({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      origin: window.location.origin,
      redirectTo: `${window.location.origin}/auth/callback`
    })
  }, [])

  const handleLogin = async () => {
    const supabase = createBrowserClient()
    
    console.log('Starting OAuth flow...')
    console.log('Debug info:', debugInfo)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('OAuth Error:', error)
        alert(`Error: ${error.message}`)
      } else {
        console.log('OAuth Data:', data)
        // OAuth가 성공하면 Google 페이지로 자동 리다이렉트됩니다
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(`Unexpected error: ${err}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">OAuth Test</h1>
      <button 
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Google Login
      </button>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        {origin && (
          <>
            <p>Origin: {origin}</p>
            <p>Redirect URL: {origin}/auth/callback</p>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>Has Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
          </>
        )}
      </div>
    </div>
  )
}
