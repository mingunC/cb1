# Quote Submission 401 Error 완전 해결 가이드

## 문제 상황
`POST /api/quotes/submit` 엔드포인트에서 **401 Unauthorized** 에러가 지속적으로 발생

## 근본 원인
1. **쿠키 전달 문제**: API 라우트에서 Supabase 세션 쿠키를 제대로 읽지 못함
2. **불명확한 에러 메시지**: 왜 인증이 실패했는지 알 수 없음
3. **프론트엔드 에러 핸들링 부족**: 401 에러 발생 시 적절한 대응 없음

## 해결 방법

### 1. `lib/api/auth.ts` 수정

더 명확한 에러 메시지와 구체적인 에러 타입 구분을 추가했습니다.

```typescript
export async function requireAuth(request: NextRequest) {
  // ... 기존 코드 ...
  if (error || !user) {
    console.error('❌ Auth error:', error?.message || 'No user found')
    
    // ✅ 구체적인 에러 메시지
    if (error?.message?.includes('session_not_found')) {
      throw ApiErrors.unauthorized('Session expired. Please log in again.')
    }
    if (error?.message?.includes('invalid_token')) {
      throw ApiErrors.unauthorized('Invalid authentication token. Please log in again.')
    }
    
    throw ApiErrors.unauthorized('Please log in to continue.')
  }
}
```

### 2. `components/contractor/QuoteModal.tsx` 수정

견적서 제출 전에 클라이언트에서 먼저 인증을 확인하도록 개선했습니다.

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // ✅ 1단계: 프론트엔드에서 인증 확인
  try {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      toast.error('Please log in as a contractor to submit a quote.')
      router.push('/contractor-login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    // ✅ 사용자 역할 확인
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    if (profile?.user_type !== 'contractor') {
      toast.error('Only contractors can submit quotes.')
      router.push('/contractor-login')
      return
    }
  } catch (error) {
    toast.error('Authentication check failed. Please log in again.')
    router.push('/contractor-login')
    return
  }

  // ... 견적서 제출 로직 ...
}
```

## 디버깅 방법

### 브라우저 Console에서 확인

```javascript
// 1. 세션 확인
const { createClient } = await import('@/lib/supabase/client')
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// 2. 사용자 정보 확인
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// 3. 프로필 확인
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user?.id)
  .single()
console.log('Profile:', profile)
```

### Network 탭에서 확인

1. **Request Headers**: 쿠키가 포함되어 있는지 확인
2. **Response**: 에러 메시지 확인

## 테스트 체크리스트

- [ ] Contractor로 로그인 후 견적서 제출
- [ ] 로그인 없이 견적서 제출 (리다이렉트 확인)
- [ ] Customer 계정으로 견적서 제출 (권한 에러 확인)
- [ ] 브라우저 Console 에러 로그 확인
- [ ] Network 탭 쿠키 전달 확인

## 추가 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [기존 QUOTE-SUBMISSION-401-FIX.md](./QUOTE-SUBMISSION-401-FIX.md)
