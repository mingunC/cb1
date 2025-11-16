# 에러 해결 완료 ✅

## 발견된 문제

### 1. 404 Error - Forgot Password 페이지 없음
```
GET https://canadabeaver.pro/forgot-password?_rsc=ioq9w 404 (Not Found)
```

### 2. 401 Error - Quote Submission 인증 실패
```
POST https://canadabeaver.pro/api/quotes/submit 401 (Unauthorized)
```

## 해결된 사항

### ✅ Forgot Password 기능 추가

새로 생성된 페이지:
- `/app/forgot-password/page.tsx` - 비밀번호 재설정 요청 페이지
- `/app/auth/reset-password/page.tsx` - 새 비밀번호 설정 페이지

**사용 방법:**
1. 로그인 페이지에서 "비밀번호를 잊으셨나요?" 링크 추가 필요
2. 사용자가 이메일 입력
3. Supabase에서 비밀번호 재설정 이메일 발송
4. 사용자가 이메일 링크 클릭 → `/auth/reset-password`로 이동
5. 새 비밀번호 설정 완료

### ✅ 401 Error 해결 가이드 생성

**주요 원인:**
1. 사용자가 로그인하지 않음
2. 세션이 만료됨
3. 사용자의 `user_type`이 'contractor'가 아님

**빠른 해결 방법:**

#### 즉시 확인할 사항

브라우저 콘솔에서 실행:
```javascript
// 1. 세션 확인
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('로그인 상태:', !!session)
console.log('사용자 ID:', session?.user?.id)

// 2. 사용자 타입 확인
const { data: profile } = await supabase
  .from('users')
  .select('user_type, email')
  .eq('id', session?.user?.id)
  .single()
console.log('사용자 타입:', profile?.user_type)
```

#### 해결 단계

**Step 1: 로그인 확인**
- Contractor 계정으로 로그인했는지 확인
- 세션이 유효한지 확인

**Step 2: 권한 확인**
```sql
-- Supabase SQL Editor에서 실행
SELECT id, email, user_type 
FROM users 
WHERE email = 'your-email@example.com';
```
→ `user_type`이 **'contractor'**인지 확인

**Step 3: Contractor 레코드 확인**
```sql
SELECT c.*, u.email 
FROM contractors c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'your-email@example.com';
```
→ contractors 테이블에 레코드가 있는지 확인

**Step 4: 문제 해결**

만약 user_type이 'contractor'가 아니라면:
```sql
UPDATE users 
SET user_type = 'contractor' 
WHERE email = 'your-email@example.com';
```

만약 contractors 테이블에 레코드가 없다면:
```sql
-- 먼저 user_id 확인
SELECT id FROM users WHERE email = 'your-email@example.com';

-- contractors 테이블에 추가
INSERT INTO contractors (user_id, company_name, email, phone)
VALUES (
  '위에서_확인한_user_id',
  'Your Company Name',
  'your-email@example.com',
  'Your Phone Number'
);
```

## 추가 개선 사항

### 로그인 페이지에 "비밀번호 찾기" 링크 추가

`app/login/page.tsx` 또는 `app/contractor-login/page.tsx`에 추가:

```tsx
<div className="text-sm">
  <Link
    href="/forgot-password"
    className="font-medium text-orange-600 hover:text-orange-500"
  >
    비밀번호를 잊으셨나요?
  </Link>
</div>
```

### 견적서 제출 전 인증 체크 추가

견적서 제출 컴포넌트에 추가:

```typescript
const handleSubmitQuote = async () => {
  // 1. 먼저 인증 확인
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    alert('로그인이 필요합니다.')
    router.push('/contractor-login')
    return
  }
  
  // 2. 역할 확인
  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', session.user.id)
    .single()
  
  if (profile?.user_type !== 'contractor') {
    alert('Contractor 계정만 견적서를 제출할 수 있습니다.')
    return
  }
  
  // 3. 견적서 제출
  try {
    const response = await fetch('/api/quotes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '견적서 제출 실패')
    }
    
    alert('견적서가 성공적으로 제출되었습니다!')
  } catch (error) {
    console.error('Quote submission error:', error)
    alert(error.message)
  }
}
```

## 테스트 방법

### 1. Forgot Password 기능 테스트
1. 브라우저에서 `https://canadabeaver.pro/forgot-password` 접속
2. 이메일 입력 후 "비밀번호 재설정 링크 보내기" 클릭
3. 이메일 확인 (Supabase 이메일 설정 필요)
4. 링크 클릭하여 비밀번호 재설정

### 2. Quote Submission 테스트
1. Contractor 계정으로 로그인
2. 브라우저 콘솔에서 인증 상태 확인
3. 견적서 제출 시도
4. Network 탭에서 401 에러가 더 이상 발생하지 않는지 확인

## 관련 문서

- **상세 가이드**: [QUOTE-SUBMISSION-401-FIX.md](./QUOTE-SUBMISSION-401-FIX.md)
- **Supabase Auth 설정**: 이메일 템플릿 및 리다이렉트 URL 설정 필요

## 주의사항

⚠️ **Supabase Email 설정 필요**

비밀번호 재설정 기능이 작동하려면 Supabase Dashboard에서:
1. Authentication → Email Templates → "Reset Password" 설정
2. Authentication → URL Configuration:
   - Site URL: `https://canadabeaver.pro`
   - Redirect URLs에 추가: `https://canadabeaver.pro/auth/reset-password`

⚠️ **개발 환경에서 테스트**

로컬 환경에서는:
```
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/reset-password
```

## 문제가 계속되면?

1. 브라우저 콘솔에서 에러 메시지 확인
2. Supabase Dashboard → Logs 확인
3. Network 탭에서 요청/응답 확인
4. [QUOTE-SUBMISSION-401-FIX.md](./QUOTE-SUBMISSION-401-FIX.md) 참고
