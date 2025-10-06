# 🚨 로고 업로드 "업로드 중..." 멈춤 현상 긴급 수정 가이드

## 증상
- 로고 이미지를 업로드하면 "업로드 중..."이라고만 표시됨
- 이미지가 실제로 표시되지 않음
- 콘솔에 에러: `column contractors.company_logo does not exist`

## 원인
**contractors 테이블에 `company_logo` 컬럼이 없습니다!**

## ⚡ 즉시 해결 방법

### 1단계: SQL 실행 (필수!)

Supabase Dashboard → SQL Editor로 이동하여 다음 명령어를 **반드시 실행**하세요:

```sql
-- contractors 테이블에 company_logo 컬럼 추가
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS company_logo TEXT;
```

또는 저장소의 `add-company-logo-column.sql` 파일 전체를 실행하세요.

### 2단계: 페이지 새로고침

브라우저에서 **Ctrl+F5** (또는 Cmd+Shift+R)로 캐시를 지우고 새로고침하세요.

### 3단계: 테스트

1. 프로필 관리 페이지 접속
2. 로고 업로드
3. 이미지가 즉시 표시되는지 확인

## 🔍 확인 방법

### 콘솔 로그 확인
브라우저 개발자 도구(F12) → Console 탭에서 다음 로그를 확인하세요:

```
✅ 정상 동작 시:
📤 로고 업로드 시작...
1️⃣ 파일 업로드 중: contractor-logos/xxx.jpg
✅ 업로드 성공
2️⃣ Public URL 생성: https://...
3️⃣ 미리보기 업데이트 완료
4️⃣ DB 저장 시도...
✅ DB 저장 성공
📤 로고 업로드 프로세스 종료

❌ 문제 발생 시:
컬럼 확인 중 오류: {code: '42703', ...}
또는
❌ DB 저장 실패: column contractors.company_logo does not exist
```

### Supabase에서 직접 확인

```sql
-- 1. 컬럼이 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contractors' 
  AND column_name = 'company_logo';

-- 2. 실제 데이터 확인
SELECT id, company_name, company_logo 
FROM contractors 
LIMIT 5;
```

## 📋 전체 체크리스트

- [ ] `add-company-logo-column.sql` 실행
- [ ] Supabase에서 company_logo 컬럼 존재 확인
- [ ] 코드 최신 버전으로 배포됨
- [ ] 브라우저 캐시 삭제 후 새로고침
- [ ] 테스트: 이미지 업로드 후 즉시 표시 확인
- [ ] 페이지 새로고침 후에도 이미지 유지 확인

## 🎯 핵심 수정 사항

### Before (문제 있던 코드)
```typescript
// DB에 저장하지 않고 state만 업데이트
setFormData(prev => ({ ...prev, company_logo: publicUrl }))
```

### After (수정된 코드)
```typescript
// 1. 미리보기 즉시 업데이트
setLogoPreview(publicUrl)

// 2. DB에 즉시 저장
await supabase
  .from('contractors')
  .update({ 
    company_logo: publicUrl,
    updated_at: new Date().toISOString()
  })
  .eq('id', profile.id)

// 3. 프로필 상태도 업데이트
setProfile(prev => prev ? { ...prev, company_logo: publicUrl } : null)
```

## 🐛 여전히 문제가 있다면?

### 1. Storage 버킷 확인
Supabase Dashboard → Storage → `portfolios` 버킷이 있는지 확인

없다면:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;
```

### 2. Storage 정책 확인
```sql
-- Storage 정책 확인
SELECT * FROM storage.policies WHERE bucket_id = 'portfolios';
```

없다면 `fix-company-logo-storage.sql` 실행

### 3. 브라우저 콘솔 에러 확인
- 네트워크 탭에서 실패한 요청 확인
- 콘솔 탭에서 에러 메시지 확인
- 에러 코드 확인:
  - `42703`: 컬럼이 없음 → SQL 실행
  - `401/403`: 권한 문제 → Storage 정책 확인
  - `404`: 버킷 없음 → 버킷 생성

## 📞 지원

문제가 계속되면 다음 정보와 함께 문의하세요:

1. 브라우저 콘솔의 전체 에러 로그
2. Supabase SQL Editor에서 실행한 쿼리 결과
3. Network 탭의 실패한 요청 스크린샷

---

**마지막 업데이트**: 2025-10-06  
**관련 파일**: 
- `add-company-logo-column.sql` (필수!)
- `fix-company-logo-storage.sql` (선택)
- `app/contractor/profile/page.tsx`
