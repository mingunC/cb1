'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<any>({})
  
  useEffect(() => {
    // 환경변수 확인
    const envInfo = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
    
    // localStorage 확인
    const storageInfo = {
      allKeys: Object.keys(localStorage),
      supabaseKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-')),
      cookieExists: document.cookie.length > 0,
      cookies: document.cookie
    }
    
    setInfo({
      env: envInfo,
      storage: storageInfo,
      location: {
        href: window.location.href,
        hostname: window.location.hostname,
        port: window.location.port
      }
    })
    
    // Supabase 클라이언트 테스트
    try {
      import('@/lib/supabase/clients').then(module => {
        try {
          const client = module.createBrowserClient()
          setInfo(prev => ({
            ...prev,
            supabaseClient: 'Successfully created',
            clientInfo: {
              url: client.supabaseUrl,
              hasKey: !!client.supabaseKey
            }
          }))
          
          // 세션 체크 시도
          client.auth.getSession().then(({ data, error }) => {
            setInfo(prev => ({
              ...prev,
              sessionCheck: {
                hasSession: !!data.session,
                error: error?.message || null,
                user: data.session?.user?.email || null
              }
            }))
          })
        } catch (clientError: any) {
          setInfo(prev => ({
            ...prev,
            supabaseClient: 'Failed to create',
            clientError: clientError.message
          }))
        }
      }).catch(importError => {
        setInfo(prev => ({
          ...prev,
          importError: importError.message
        }))
      })
    } catch (err: any) {
      setInfo(prev => ({
        ...prev,
        generalError: err.message
      }))
    }
  }, [])
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-xs overflow-auto">
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 space-y-2">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
        
        <button 
          onClick={() => {
            localStorage.clear()
            alert('LocalStorage cleared!')
            window.location.reload()
          }}
          className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear LocalStorage
        </button>
        
        <button 
          onClick={() => {
            console.log('Full Info:', info)
            alert('Check browser console for full info')
          }}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Log to Console
        </button>
      </div>
    </div>
  )
}
