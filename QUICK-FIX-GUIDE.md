# 🚨 긴급 문제 해결 가이드

## 현재 발생 중인 이슈

### 1. 로고 업로드가 "업로드 중..."에서 멈춤 ⚠️
**증상**: 로고를 업로드하면 계속 "업로드 중..."만 표시되고 이미지가 나타나지 않음

**해결**: [`LOGO-UPLOAD-FIX.md`](./LOGO-UPLOAD-FIX.md) 참고

**빠른 해결**:
```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS company_logo TEXT;
```

---

### 2. 프로필 저장 시 PGRST204 에러 ⚠️
**증상**: 
```
Error saving profile: Could not find the 'insurance' column
```

**해결**: [`PROFILE-SAVE-ERROR-FIX.md`](./PROFILE-SAVE-ERROR-FIX.md) 참고

**빠른 해결**:
```sql
-- Supabase SQL Editor에서 실행 (add-profile-columns.sql)
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS years_in_business INTEGER DEFAULT 0;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS insurance TEXT;
```

---

## 📁 주요 파일

### 필수 SQL 파일 (순서대로 실행)
1. **`add-profile-columns.sql`** ⭐⭐⭐ (가장 중요!)
   - contractors 테이블에 필수 컬럼 5개 추가
   - **반드시 먼저 실행하세요**

2. `fix-company-logo-storage.sql`
   - Storage 버킷 및 정책 설정
   - 이미지 업로드 관련 설정

3. `supabase-setup.sql`
   - 전체 데이터베이스 초기 설정
   - 처음 시작할 때만 필요

### 문서
- `LOGO-UPLOAD-FIX.md` - 로고 업로드 문제 해결
- `PROFILE-SAVE-ERROR-FIX.md` - 프로필 저장 에러 해결
- `docs/fix-company-logo-guide.md` - 상세 가이드

---

## ✅ 해결 체크리스트

### 처음 설정 시
- [ ] Supabase 프로젝트 생성
- [ ] `supabase-setup.sql` 실행
- [ ] **`add-profile-columns.sql` 실행** ⭐
- [ ] `fix-company-logo-storage.sql` 실행
- [ ] 환경변수 설정 (.env.local)
- [ ] `npm install && npm run dev`

### 이미 실행 중인데 에러 발생 시
- [ ] **`add-profile-columns.sql` 실행** ⭐ (가장 먼저!)
- [ ] 브라우저 새로고침 (Ctrl+F5)
- [ ] 테스트: 로고 업로드
- [ ] 테스트: 프로필 정보 저장

---

## 🔍 에러 메시지별 해결법

| 에러 메시지 | 원인 | 해결 파일 |
|------------|------|----------|
| `column contractors.company_logo does not exist` | company_logo 컬럼 누락 | `add-profile-columns.sql` |
| `Could not find the 'insurance' column` | 기타 컬럼 누락 | `add-profile-columns.sql` |
| `Policy violation` | Storage 정책 미설정 | `fix-company-logo-storage.sql` |
| `Bucket not found` | Storage 버킷 미생성 | `fix-company-logo-storage.sql` |
| 404 on image URL | 이미지가 실제로 업로드 안됨 | Storage 설정 확인 |

---

## 🚀 정상 동작 확인 방법

### 1. 로고 업로드 테스트
```
✅ 파일 선택
✅ "업로드 중..." 표시
✅ 2-3초 후 이미지 표시
✅ "로고가 성공적으로 업로드되었습니다!" 메시지
✅ 페이지 새로고침 후에도 이미지 유지
```

### 2. 프로필 저장 테스트
```
✅ 회사명, 설명 등 입력
✅ "저장" 버튼 클릭
✅ "프로필이 업데이트되었습니다" 메시지
✅ 페이지 새로고침 후 정보 유지
```

### 3. 콘솔 로그 확인 (F12)
```
✅ 로고 업로드 시작...
✅ 1️⃣ 파일 업로드 중
✅ ✅ 업로드 성공
✅ 2️⃣ Public URL 생성
✅ 3️⃣ 미리보기 업데이트 완료
✅ 4️⃣ DB 저장 시도...
✅ ✅ DB 저장 성공
✅ ✅ 이미지 로드 성공
```

---

## 💡 자주 묻는 질문

**Q: SQL을 어디서 실행하나요?**
A: Supabase Dashboard → SQL Editor

**Q: 여러 SQL 파일을 모두 실행해야 하나요?**
A: 아니요. 에러에 따라 필요한 것만 실행하면 됩니다. 대부분의 경우 `add-profile-columns.sql`만 실행하면 해결됩니다.

**Q: SQL 실행 후에도 에러가 계속됩니다**
A: 브라우저 캐시를 삭제하고(Ctrl+F5) 다시 시도하세요. 안 되면 Supabase 프로젝트를 재시작하세요.

**Q: 이미 올린 이미지는 어떻게 되나요?**
A: Supabase Storage에 안전하게 저장되어 있습니다. DB 컬럼만 추가하면 다시 표시됩니다.

---

## 📞 추가 도움이 필요하면?

1. 브라우저 콘솔(F12)의 에러 메시지 전체 복사
2. 실행한 SQL 쿼리 기록
3. 현재 테이블 구조:
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'contractors'
ORDER BY ordinal_position;
```

이 정보들과 함께 이슈를 제출해주세요.

---

**마지막 업데이트**: 2025-10-06  
**프로젝트**: CB1 Construction Bidding Platform
