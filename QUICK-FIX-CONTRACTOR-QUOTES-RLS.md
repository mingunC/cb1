# Contractor Quotes RLS 오류 빠른 해결 가이드

## 🚨 오류 증상
```
Error: 견적서 저장에 실패했습니다: new row violates row-level security policy for table "contractor_quotes"
```

## ✅ 빠른 해결 (3단계)

### 1단계: SQL 실행 (1분)
Supabase SQL Editor에서 실행:
```sql
-- fix-contractor-quotes-rls-service-role.sql 파일 내용 복사/붙여넣기
```
또는 직접 복사:
```sql
-- Service role bypass policy
DROP POLICY IF EXISTS "Service role can do anything" ON contractor_quotes;
CREATE POLICY "Service role can do anything"
ON contractor_quotes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Enable RLS
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;
```

### 2단계: 환경 변수 확인 (2분)

**로컬 개발 (`.env.local`):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ 필수!
```

**Vercel 배포:**
1. Vercel Dashboard → Settings → Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 추가
3. Production, Preview, Development 모두 체크
4. 재배포

**Service Role Key 찾기:**
- Supabase Dashboard → Project Settings → API
- "Service Role" (secret) 키 복사

### 3단계: 재시작/재배포

**로컬:**
```bash
# 서버 재시작
npm run dev
```

**Vercel:**
- Git push 또는 Vercel Dashboard에서 재배포

## 🔍 문제 확인

### 테스트 1: RLS 정책 확인
```sql
SELECT policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'contractor_quotes';
```

**예상 결과:**
- ✅ "Service role can do anything" - service_role - ALL
- ✅ "Contractors can insert their own quotes" - authenticated - INSERT

### 테스트 2: 환경 변수 확인
서버 로그에서 다음 메시지 확인:
- ❌ "SUPABASE_SERVICE_ROLE_KEY is not configured!" → 환경 변수 누락
- ✅ "Quote saved successfully" → 정상 작동

## 📋 체크리스트

- [ ] SQL 파일 실행 완료
- [ ] `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] Vercel에 환경 변수 추가 (배포 환경인 경우)
- [ ] 개발 서버 재시작
- [ ] 브라우저 캐시 삭제 (Ctrl+Shift+R)
- [ ] 견적서 제출 테스트

## 🆘 여전히 안 되는 경우

### 문제: "Server configuration error"
→ Service Role Key가 환경 변수에 없음
→ `.env.local` 파일 확인 및 서버 재시작

### 문제: "RLS policy violation"
→ SQL이 제대로 실행되지 않음
→ Supabase SQL Editor에서 정책 재실행

### 문제: 배포 환경에서만 오류
→ Vercel 환경 변수 누락
→ Vercel Dashboard에서 환경 변수 추가 후 재배포

## ⚠️ 중요 보안 사항

❌ **절대 하지 말 것:**
- Service Role Key를 GitHub에 커밋
- Service Role Key를 클라이언트 코드에서 사용
- Service Role Key를 공개 저장소에 노출

✅ **해야 할 것:**
- `.env.local`에만 저장 (이미 `.gitignore`에 포함됨)
- 서버 사이드 API routes에서만 사용
- Vercel 등 배포 플랫폼의 환경 변수로만 관리

## 📚 관련 문서

- 상세 가이드: `CONTRACTOR-QUOTES-RLS-FIX-GUIDE.md`
- SQL 파일: `fix-contractor-quotes-rls-service-role.sql`
- API 코드: `app/api/quotes/submit/route.ts`
