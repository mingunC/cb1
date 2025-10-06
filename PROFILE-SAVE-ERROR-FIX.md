# 🚨 프로필 저장 에러 긴급 수정 (PGRST204)

## 증상
```
Error saving profile: {
  code: 'PGRST204',
  message: "Could not find the 'insurance' column of 'contractors' in the schema cache"
}
```

또는 다른 컬럼 이름으로 같은 에러 발생

## 원인
contractors 테이블에 프로필 페이지에서 사용하는 컬럼들이 누락되어 있습니다:
- ❌ `company_logo`
- ❌ `description`
- ❌ `website`
- ❌ `years_in_business`
- ❌ `insurance`

## ⚡ 즉시 해결 (2분 소요)

### 방법 1: 통합 SQL 실행 (권장)

Supabase Dashboard → SQL Editor에서 **`add-profile-columns.sql`** 전체 실행

이 스크립트는:
1. ✅ 현재 테이블 구조 확인
2. ✅ 누락된 컬럼 5개 추가
3. ✅ 기존 데이터 마이그레이션
4. ✅ 인덱스 추가
5. ✅ 결과 확인

### 방법 2: 빠른 수동 실행

최소한 이것만 실행하세요:

```sql
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS years_in_business INTEGER DEFAULT 0;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS insurance TEXT;
```

## 🔍 확인 방법

```sql
-- 컬럼이 모두 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'contractors'
  AND column_name IN ('company_logo', 'description', 'website', 'years_in_business', 'insurance')
ORDER BY column_name;

-- 결과: 5개 행이 반환되어야 함
```

## 🎯 테스트

1. ✅ SQL 실행 완료
2. ✅ 브라우저 새로고침 (Ctrl+F5)
3. ✅ 프로필 정보 입력
4. ✅ **"저장" 버튼** 클릭
5. ✅ "프로필이 업데이트되었습니다" 메시지 확인

## 📋 전체 체크리스트

- [ ] `add-profile-columns.sql` 실행
- [ ] 5개 컬럼 모두 추가 확인
- [ ] 브라우저 캐시 삭제
- [ ] 프로필 페이지 접속
- [ ] 로고 업로드 성공 확인
- [ ] 프로필 정보 입력
- [ ] 저장 버튼 클릭 성공
- [ ] 페이지 새로고침 후 정보 유지 확인

## ❓ 추가 문제 해결

### 1. "스키마 캐시를 찾을 수 없음" 에러가 계속됨

```sql
-- PostgREST 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 또는 Supabase 프로젝트 재시작
-- Settings → Database → Restart
```

### 2. 다른 컬럼 에러가 발생함

에러 메시지에 나온 컬럼 이름을 확인하고:

```sql
-- 해당 컬럼 추가
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS [컬럼명] TEXT;
```

### 3. 기존 데이터가 있는 경우

```sql
-- insurance_info → insurance 데이터 복사
UPDATE contractors
SET insurance = insurance_info
WHERE insurance IS NULL AND insurance_info IS NOT NULL;

-- years_experience → years_in_business 데이터 복사
UPDATE contractors
SET years_in_business = years_experience
WHERE years_in_business = 0 AND years_experience > 0;
```

## 🏗️ 테이블 구조 비교

### 원래 테이블 (create-contractors-table.sql)
```sql
- user_id
- company_name
- contact_name
- phone
- email
- address
- license_number
- insurance_info      ← 주의
- specialties
- years_experience    ← 주의
- portfolio_count
- rating
- status
```

### 프로필 페이지에서 필요한 컬럼
```sql
- company_logo        ← 추가 필요
- description         ← 추가 필요
- website            ← 추가 필요
- years_in_business  ← 추가 필요
- insurance          ← 추가 필요
```

## 💡 왜 이런 문제가?

1. 초기 테이블 생성 시 일부 컬럼 누락
2. 프로필 페이지 개발 시 다른 컬럼명 사용
3. 스키마 변경 후 PostgREST 캐시 미갱신

## 📞 도움이 필요하면?

다음 정보를 함께 제공하세요:

1. 실행한 SQL 쿼리
2. 에러 메시지 전체
3. 현재 테이블 구조:
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'contractors'
ORDER BY ordinal_position;
```

---

**마지막 업데이트**: 2025-10-06  
**관련 파일**: 
- `add-profile-columns.sql` ⭐ (필수!)
- `create-contractors-table.sql` (참고)
