# Quote Submission 401 Error 해결 가이드

## 문제 상황

`POST /api/quotes/submit` 엔드포인트에서 **401 Unauthorized** 에러가 발생하는 경우

## 원인 분석

401 에러가 발생하는 주요 원인:

1. **사용자 인증 실패**: 사용자가 로그인하지 않았거나 세션이 만료됨
2. **권한 부족**: 사용자의 `user_type`이 'contractor'가 아님
3. **세션 문제**: 쿠키가 제대로 전달되지 않음

## 확인 사항

### 1. 사용자 인증 상태 확인

```typescript
// 클라이언트 코드에서 확인
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session }, error } = await supabase.auth.getSession()

console.log('Session:', session) // null이면 로그인 필요
console.log('User:', session?.user)
```

### 2. 사용자 역할 확인

```sql
-- Supabase SQL Editor에서 확인
SELECT id, email, user_type 
FROM users 
WHERE id = '사용자_ID';
```

contractor로 로그인한 사용자의 `user_type`이 **'contractor'**여야 합니다.

### 3. contractors 테이블 연결 확인

```sql
-- contractor 레코드 존재 여부 확인
SELECT c.*, u.email, u.user_type
FROM contractors c
JOIN users u ON c.user_id = u.id
WHERE u.id = '사용자_ID';
```

## 해결 방법

### Option 1: 로그인 상태 확인 및 재로그인

```typescript
// 견적서 제출 전 인증 확인
const checkAuthBeforeSubmit = async () => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // 로그인 페이지로 리다이렉트
    router.push('/contractor-login?redirect=/contractor/dashboard')
    return false
  }
  
  // 사용자 역할 확인
  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', session.user.id)
    .single()
  
  if (profile?.user_type !== 'contractor') {
    alert('Contractor 계정으로 로그인해주세요.')
    return false
  }
  
  return true
}

// 견적서 제출 시 사용
const handleSubmitQuote = async () => {
  const isAuthenticated = await checkAuthBeforeSubmit()
  if (!isAuthenticated) return
  
  // 견적서 제출 로직
  const response = await fetch('/api/quotes/submit', {
    method: 'POST',
    // ...
  })
}
```

### Option 2: API 라우트에 더 나은 에러 메시지 추가

현재 API는 `requireRole(['contractor'])`를 사용하여 단순히 403을 반환합니다. 더 명확한 에러 메시지를 제공하도록 개선:

```typescript
// app/api/quotes/submit/route.ts 수정
const handler = createApiHandler({
  POST: async (req) => {
    try {
      const { user } = await requireRole(['contractor'])
      
      // ... 기존 로직
    } catch (error) {
      // 더 구체적인 에러 메시지 제공
      if (error.code === 'UNAUTHORIZED') {
        return NextResponse.json(
          { 
            success: false, 
            error: '로그인이 필요합니다. 다시 로그인해주세요.',
            code: 'UNAUTHORIZED',
            redirect: '/contractor-login'
          },
          { status: 401 }
        )
      }
      
      if (error.code === 'FORBIDDEN') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Contractor 계정만 견적서를 제출할 수 있습니다.',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        )
      }
      
      throw error
    }
  },
})
```

### Option 3: 프론트엔드에서 에러 핸들링 개선

```typescript
// 견적서 제출 함수
const submitQuote = async (quoteData) => {
  try {
    const response = await fetch('/api/quotes/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        // 세션 만료 - 로그인 페이지로 리다이렉트
        alert('세션이 만료되었습니다. 다시 로그인해주세요.')
        window.location.href = '/contractor-login?redirect=' + encodeURIComponent(window.location.pathname)
        return
      }
      
      if (response.status === 403) {
        alert('권한이 없습니다. Contractor 계정으로 로그인해주세요.')
        return
      }
      
      throw new Error(data.error || '견적서 제출에 실패했습니다.')
    }

    // 성공
    alert('견적서가 성공적으로 제출되었습니다!')
    
  } catch (error) {
    console.error('Quote submission error:', error)
    alert(error.message)
  }
}
```

### Option 4: 세션 자동 갱신 설정

Supabase 클라이언트에서 세션 자동 갱신 활성화:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true, // 자동 토큰 갱신
        persistSession: true,    // 세션 유지
        detectSessionInUrl: true // URL에서 세션 감지
      }
    }
  )
```

## 디버깅 팁

### 1. 브라우저 개발자 도구에서 확인

```javascript
// Console에서 실행
// 1. 현재 세션 확인
const { createClient } = await import('@/lib/supabase/client')
const supabase = createClient()
const session = await supabase.auth.getSession()
console.log('Session:', session)

// 2. 사용자 정보 확인
const user = await supabase.auth.getUser()
console.log('User:', user)

// 3. 프로필 확인
const profile = await supabase.from('users').select('*').eq('id', user.data.user?.id).single()
console.log('Profile:', profile)
```

### 2. Network 탭에서 확인

- Request Headers에 쿠키가 포함되어 있는지 확인
- Response가 401인지 403인지 확인
- Response body의 에러 메시지 확인

### 3. Supabase 로그 확인

Supabase Dashboard → Logs → API에서:
- Authentication 실패 로그 확인
- RLS policy 위반 확인

## 예방 조치

### 1. Protected Route 패턴 사용

```typescript
// app/contractor/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ContractorDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/contractor-login')
  }
  
  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()
  
  if (profile?.user_type !== 'contractor') {
    redirect('/login')
  }
  
  // Dashboard 렌더링
  return <div>Dashboard Content</div>
}
```

### 2. Middleware에서 인증 확인

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Contractor routes 보호
  if (pathname.startsWith('/contractor')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/contractor-login', request.url))
    }
    
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()
    
    if (profile?.user_type !== 'contractor') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/contractor/:path*']
}
```

## 추가 리소스

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
