# QuoteModal.tsx handleSubmit 함수 수정 가이드

`components/contractor/QuoteModal.tsx` 파일의 `handleSubmit` 함수를 다음과 같이 수정하세요:

## 수정할 위치
약 188번째 줄의 `const handleSubmit = async (e: React.FormEvent)` 함수

## 주요 변경 사항

### 1. 프론트엔드 인증 확인 추가

API 호출 전에 클라이언트에서 먼저 세션을 확인합니다:

```typescript
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
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile fetch error:', profileError)
    toast.error('Failed to verify user profile. Please try again.')
    return
  }

  if (profile.user_type !== 'contractor') {
    toast.error('Only contractors can submit quotes. Please log in with a contractor account.')
    router.push('/contractor-login')
    return
  }
} catch (error) {
  console.error('❌ Auth check error:', error)
  toast.error('Authentication check failed. Please log in again.')
  router.push('/contractor-login?redirect=' + encodeURIComponent(window.location.pathname))
  return
}
```

### 2. 입력 검증 개선

price 필드에 대한 검증을 추가합니다:

```typescript
if (!price || parseFloat(price) <= 0) {
  toast.error('Please enter a valid quote amount.')
  return
}
```

### 3. 401/403 에러 처리

API 응답에서 401/403 에러를 명시적으로 처리합니다:

```typescript
// ✅ 에러 응답 처리
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ 
    error: 'Failed to parse error response',
    code: 'UNKNOWN_ERROR' 
  }))
  
  console.error('❌ API Error:', errorData)

  // ✅ 401 Unauthorized - 세션 만료
  if (response.status === 401) {
    toast.error('Session expired. Please log in again.')
    router.push('/contractor-login?redirect=' + encodeURIComponent(window.location.pathname))
    return
  }

  // ✅ 403 Forbidden - 권한 없음
  if (response.status === 403) {
    toast.error('Access denied. Please log in as a contractor.')
    router.push('/contractor-login')
    return
  }

  throw new Error(errorData.error || 'Failed to submit quote')
}
```

## 전체 수정된 함수

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (process.env.NODE_ENV === 'development') console.log('🎯 Submit button clicked!')
  
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
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile fetch error:', profileError)
      toast.error('Failed to verify user profile. Please try again.')
      return
    }

    if (profile.user_type !== 'contractor') {
      toast.error('Only contractors can submit quotes. Please log in with a contractor account.')
      router.push('/contractor-login')
      return
    }
  } catch (error) {
    console.error('❌ Auth check error:', error)
    toast.error('Authentication check failed. Please log in again.')
    router.push('/contractor-login?redirect=' + encodeURIComponent(window.location.pathname))
    return
  }

  // ✅ 2단계: 입력 검증
  if (!project || !contractorId) {
    console.error('❌ Missing project or contractorId')
    toast.error('Missing required information')
    return
  }

  if (!pdfFile) {
    toast.error('Please upload a detailed quote PDF file.')
    return
  }

  if (!price || parseFloat(price) <= 0) {
    toast.error('Please enter a valid quote amount.')
    return
  }

  if (isSubmitting) {
    if (process.env.NODE_ENV === 'development') console.log('⚠️ Already submitting, ignoring duplicate click')
    return
  }

  if (process.env.NODE_ENV === 'development') console.log('✅ Starting quote submission...')
  setIsSubmitting(true)
  
  try {
    // ✅ 3단계: PDF 파일 업로드
    if (process.env.NODE_ENV === 'development') console.log('📤 Step 1: Uploading PDF file...')
    const uploadResult = await uploadQuote(pdfFile, project.id, contractorId)
    if (process.env.NODE_ENV === 'development') console.log('✅ PDF uploaded:', uploadResult.pdfUrl)
    
    // ✅ 4단계: API를 통해 견적서 제출 (이메일 자동 전송)
    if (process.env.NODE_ENV === 'development') console.log('📧 Step 2: Submitting quote via API...')
    const response = await fetch('/api/quotes/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ 쿠키 포함
      body: JSON.stringify({
        projectId: project.id,
        contractorId: contractorId,
        price: price,
        description: detailedDescription || '', 
        pdfUrl: uploadResult.pdfUrl,
        pdfFilename: uploadResult.pdfFilename
      })
    })

    if (process.env.NODE_ENV === 'development') console.log('📡 API Response status:', response.status)

    // ✅ 에러 응답 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Failed to parse error response',
        code: 'UNKNOWN_ERROR' 
      }))
      
      console.error('❌ API Error:', errorData)

      // ✅ 401 Unauthorized - 세션 만료
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.')
        router.push('/contractor-login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      // ✅ 403 Forbidden - 권한 없음
      if (response.status === 403) {
        toast.error('Access denied. Please log in as a contractor.')
        router.push('/contractor-login')
        return
      }

      throw new Error(errorData.error || 'Failed to submit quote')
    }

    const data = await response.json()
    if (process.env.NODE_ENV === 'development') console.log('✅ Quote submitted successfully:', data)
    
    // ✅ 이메일 전송 결과 표시
    if (data.emailSent) {
      toast.success('Quote submitted and customer notified!')
    } else {
      toast.success('Quote submitted successfully!')
      if (data.emailError) {
        console.warn('⚠️ Email notification failed:', data.emailError)
      }
    }
    
    // 성공 후 콜백 호출
    setTimeout(() => {
      onSuccess()
    }, 100)
    
  } catch (error: any) {
    console.error('❌ Quote submission error:', error)
    toast.error(error.message || 'An error occurred while submitting the quote')
  } finally {
    // ✅ 어떤 경우에도 로딩 상태 해제
    if (process.env.NODE_ENV === 'development') console.log('🔄 Releasing loading state...')
    setIsSubmitting(false)
  }
}
```

## 테스트 체크리스트

수정 후 다음 시나리오를 모두 테스트하세요:

- [ ] **정상 시나리오**: Contractor로 로그인 → 견적서 제출 → 성공
- [ ] **인증 없음**: 로그인 안 함 → 견적서 제출 시도 → 로그인 페이지로 리다이렉트
- [ ] **권한 없음**: Customer로 로그인 → 견적서 제출 시도 → 에러 메시지 + 로그인 페이지
- [ ] **잘못된 입력**: 가격 입력 없이 제출 → 에러 메시지
- [ ] **PDF 없음**: PDF 업로드 없이 제출 → 에러 메시지
- [ ] **브라우저 Console**: 에러 발생 시 명확한 로그 표시 확인
- [ ] **Network 탭**: API 요청에 쿠키가 포함되어 있는지 확인

## 디버깅

문제가 계속 발생하면 브라우저 Console에서 다음을 실행하여 인증 상태를 확인하세요:

```javascript
const { createClient } = await import('@/lib/supabase/client')
const supabase = createClient()

// 1. 세션 확인
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// 2. 프로필 확인
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', session?.user?.id)
  .single()
console.log('Profile:', profile)
```
