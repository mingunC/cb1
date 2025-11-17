# Contractor Quotes RLS 오류 해결 가이드

## 문제 원인

견적서 제출 시 다음 오류 발생:
```
new row violates row-level security policy for table "contractor_quotes"
```

이 오류는 다음과 같은 이유로 발생할 수 있습니다:

1. **Service Role Key 누락**: API에서 `createAdminClient()`를 사용하지만 환경 변수가 설정되지 않음
2. **RLS 정책 문제**: service_role에 대한 명시적 허용 정책이 없음
3. **데이터 불일치**: contractor_id가 contractors 테이블에 존재하지 않음

## 해결 방법

### 1단계: SQL 파일 실행 (필수)

Supabase SQL Editor에서 다음 파일을 실행하세요:

```bash
fix-contractor-quotes-rls-service-role.sql
```

이 SQL은 다음을 수행합니다:
- service_role에 대한 전체 권한 부여 (RLS 우회)
- authenticated 사용자를 위한 적절한 CRUD 정책 생성

### 2단계: 환경 변수 확인 (중요)

`.env.local` 파일에 다음 변수들이 있는지 확인:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ 이게 중요!
```

**Service Role Key 찾는 방법:**
1. Supabase Dashboard → Project Settings → API
2. "Service Role" 키를 복사 (secret으로 표시됨)
3. `.env.local`에 추가
4. **중요**: Vercel 등 배포 환경에도 이 환경 변수를 추가해야 합니다!

### 3단계: 환경 변수 확인 코드 추가 (권장)

API route에 디버깅 로그를 추가하여 환경 변수가 제대로 설정되었는지 확인:

```typescript
// app/api/quotes/submit/route.ts 상단에 추가
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set!')
  throw ApiErrors.internal('Server configuration error')
}
```

### 4단계: Vercel 환경 변수 설정 (배포 환경)

Vercel에 배포한 경우:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 추가
3. Production, Preview, Development 모두에 적용
4. 재배포

### 5단계: 데이터 확인 (선택사항)

contractor_quotes 테이블의 외래 키 관계를 확인:

```sql
-- contractor_id가 실제 contractors 테이블에 존재하는지 확인
SELECT 
  cq.id,
  cq.contractor_id,
  c.id as contractor_exists,
  c.company_name
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE c.id IS NULL;  -- 존재하지 않는 contractor_id 찾기
```

## 검증 방법

### 테스트 1: RLS 정책 확인
```sql
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'contractor_quotes'
ORDER BY policyname;
```

예상 결과:
- "Service role can do anything" - service_role - ALL
- "Contractors can insert their own quotes" - authenticated - INSERT
- "Contractors can view their own quotes" - authenticated - SELECT
- "Contractors can update their own quotes" - authenticated - UPDATE
- "Contractors can delete their own quotes" - authenticated - DELETE

### 테스트 2: API 테스트
견적서 제출을 다시 시도하고 브라우저 콘솔 및 서버 로그를 확인하세요.

성공 시 다음과 같은 로그가 나타나야 합니다:
```
✅ Quote saved successfully: [quote_id]
📧 Starting email notification process...
✅ Email sent successfully!
```

## 추가 문제 해결

### 여전히 RLS 오류가 발생하는 경우:

1. **서버 재시작**: 환경 변수 변경 후 개발 서버를 재시작하세요
   ```bash
   npm run dev
   ```

2. **Vercel 재배포**: 배포 환경에서는 재배포가 필요합니다

3. **캐시 삭제**: 
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Service Role 권한 확인**: Supabase Dashboard에서 service role이 활성화되어 있는지 확인

## 보안 참고사항

⚠️ **중요**: Service Role Key는 절대 클라이언트 코드에 노출하면 안 됩니다!
- ✅ 서버 사이드 API routes에서만 사용
- ✅ `.env.local`에 저장 (`.gitignore`에 포함됨)
- ✅ Vercel 환경 변수에 저장
- ❌ 클라이언트 컴포넌트에서 사용 금지
- ❌ 공개 저장소에 커밋 금지

## 추가 질문

문제가 계속되면 다음 정보를 제공해주세요:
1. Supabase SQL Editor에서 SQL 실행 결과
2. 브라우저 콘솔의 전체 오류 메시지
3. 서버 로그 (터미널 출력)
4. 환경 변수가 설정되어 있는지 확인 (값은 공유하지 마세요!)
