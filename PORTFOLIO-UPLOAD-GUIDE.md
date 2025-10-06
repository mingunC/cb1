# 포트폴리오 페이지 수정 및 스토리지 검증 가이드

## 🎯 완료된 작업

### 1. ✅ 포트폴리오 페이지 더미 데이터 제거
- **파일**: `app/portfolio/page.tsx`
- **변경사항**:
  - ❌ 제거: 6개의 하드코딩된 더미 포트폴리오 데이터
  - ✅ 추가: Supabase에서 실제 데이터를 가져오는 로직
  - ✅ 개선: 에러 처리 및 빈 상태 UI

### 2. ✅ Supabase 연동
- **데이터 소스**: `portfolios` 테이블
- **조인**: `contractors` 테이블과 조인하여 업체 정보 표시
- **이미지**: Supabase Storage (`portfolio-images` 버킷)

---

## 🔍 포트폴리오 업로드 확인 방법

### Step 1: SQL 실행
Supabase SQL Editor에서 다음 파일을 **전체 실행**:
```sql
-- check-portfolio-storage.sql
```

### Step 2: 각 단계별 확인

#### ✅ Step 1: 테이블 구조 확인
```sql
-- portfolios 테이블의 컬럼 확인
-- 필수 컬럼: id, contractor_id, title, description, image_url
```
**예상 결과**: 테이블 구조가 표시됨

#### ✅ Step 2: 업로드된 포트폴리오 확인
```sql
-- 실제로 업로드된 포트폴리오 목록
SELECT title, company_name, image_url, created_at
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id;
```
**예상 결과**: 
- 업로드된 포트폴리오가 있으면 → 목록 표시
- 없으면 → "No rows returned"

#### ✅ Step 3: 업체별 포트폴리오 개수
```sql
-- 어떤 업체가 몇 개의 포트폴리오를 올렸는지
```
**해석**:
- `portfolio_count > 0` → 해당 업체가 포트폴리오 업로드함 ✅
- `portfolio_count = 0` → 아직 업로드 안함 ⚠️

#### ✅ Step 4: 스토리지 버킷 확인
```sql
-- portfolio-images 버킷이 존재하는지
```
**중요**: 
- 버킷이 없으면 → 이미지 업로드 실패 ❌
- 버킷이 있으면 → 이미지 업로드 가능 ✅

#### ✅ Step 5: 업로드된 파일 확인
```sql
-- 실제로 Supabase Storage에 저장된 이미지 파일
```
**확인사항**:
- 파일 경로: `contractor-id/timestamp.확장자`
- 예: `abc123/1696612345678.jpg`

#### ✅ Step 6: 이미지 URL 검증
```sql
-- 포트폴리오의 이미지 URL이 올바른지
```
**상태별 의미**:
- ✅ `Supabase 스토리지 사용` → 정상
- ⚠️ `외부 이미지 (Unsplash)` → 더미 데이터
- ❌ `이미지 URL 없음` → 업로드 실패

---

## 📊 업로드 상태 체크리스트

### 업체가 포트폴리오를 업로드했는지 확인

1. **Step 2 결과 확인**
   ```
   ✅ 1개 이상의 행이 반환됨 → 업로드 성공
   ❌ "No rows returned" → 아직 업로드 안함
   ```

2. **Step 5 결과 확인**
   ```
   ✅ storage.objects에 파일 있음 → 이미지 업로드됨
   ❌ "No rows returned" → 이미지 업로드 안됨
   ```

3. **Step 6 결과 확인**
   ```
   ✅ image_source = "Supabase 스토리지 사용" → 정상
   ❌ image_source = "이미지 URL 없음" → 문제 있음
   ```

---

## 🛠️ 문제 해결

### Case 1: portfolios 테이블이 없음
```sql
-- Step 8의 CREATE TABLE이 자동 실행됨
-- 수동 실행 필요 시:
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT '주거공간',
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Case 2: portfolio-images 버킷이 없음
**Supabase Dashboard에서 수동 생성**:
1. Storage → New Bucket
2. 이름: `portfolio-images`
3. Public bucket: ✅ (체크)
4. Create bucket

### Case 3: 업로드는 되는데 이미지가 안 보임
**원인**: RLS 정책 문제
```sql
-- 해결: Step 8의 RLS 정책 실행
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');
```

### Case 4: 업체가 업로드했는데 페이지에 안 보임
**확인사항**:
1. 브라우저 새로고침 (Ctrl+F5)
2. 개발자 도구 콘솔에서 에러 확인
3. Step 2 쿼리로 DB에 데이터 있는지 확인

---

## 📋 업로드 프로세스 확인

### 업체가 포트폴리오 업로드 시:

1. **PortfolioManager.tsx**에서:
   ```typescript
   // 1. 이미지를 Supabase Storage에 업로드
   const { data } = await supabase.storage
     .from('portfolio-images')
     .upload(fileName, file)
   
   // 2. Public URL 생성
   const { data: { publicUrl } } = supabase.storage
     .from('portfolio-images')
     .getPublicUrl(fileName)
   
   // 3. DB에 저장 (API 호출)
   await fetch('/api/portfolio', {
     method: 'POST',
     body: JSON.stringify({
       contractor_id,
       title,
       description,
       image_url: publicUrl  // ← Supabase URL
     })
   })
   ```

2. **결과 확인**:
   - `portfolios` 테이블에 레코드 추가됨
   - `storage.objects`에 파일 추가됨
   - `/portfolio` 페이지에 즉시 표시됨

---

## 🎨 페이지 변경사항

### Before (더미 데이터)
```typescript
const dummyData: Portfolio[] = [
  {
    title: '모던 리빙룸 인테리어',
    images: ['https://images.unsplash.com/...'],
    // ... 6개의 하드코딩된 데이터
  }
]
```

### After (실제 데이터)
```typescript
const { data, error } = await supabase
  .from('portfolios')
  .select(`
    *,
    contractor:contractors(
      id,
      company_name,
      company_logo
    )
  `)
  .order('created_at', { ascending: false })
```

---

## ✅ 테스트 시나리오

### 시나리오 1: 빈 상태
1. `check-portfolio-storage.sql` 실행
2. Step 2 결과: "No rows returned"
3. `/portfolio` 페이지 접속
4. 예상: "포트폴리오가 없습니다" 메시지 표시

### 시나리오 2: 업체가 업로드함
1. 업체 계정으로 로그인
2. 업체 대시보드 → 포트폴리오 관리
3. 프로젝트 추가 버튼 클릭
4. 이미지 업로드 + 정보 입력 + 저장
5. `check-portfolio-storage.sql` 실행
6. Step 2, 5, 6에서 데이터 확인
7. `/portfolio` 페이지에서 표시 확인

### 시나리오 3: 이미지 없이 텍스트만
1. 업로드 시 이미지 필수가 아닌 경우
2. Step 6에서 `image_url IS NULL` 확인
3. 페이지에서 플레이스홀더 아이콘 표시

---

## 📞 다음 단계

### 1. SQL 실행
```bash
# Supabase SQL Editor에서
check-portfolio-storage.sql 전체 실행
```

### 2. 결과 분석
- Step 2: 포트폴리오 개수 확인
- Step 5: 업로드된 파일 확인
- Step 6: 이미지 URL 상태 확인

### 3. 페이지 확인
```
http://localhost:3000/portfolio
```

### 4. 문제 발생 시
- 콘솔 로그 확인
- SQL 결과와 비교
- 위의 "문제 해결" 섹션 참고

---

## 📁 관련 파일

1. ✅ **app/portfolio/page.tsx** (수정완료)
   - 더미 데이터 제거
   - Supabase 연동 추가

2. ✅ **check-portfolio-storage.sql** (신규)
   - 8단계 진단 쿼리
   - 테이블/버킷 자동 생성

3. **components/PortfolioManager.tsx**
   - 업로드 로직 (기존)
   - Storage 사용 중

4. **API Routes** (필요 시 확인)
   - `/api/portfolio` (POST, PUT, DELETE)

---

**마지막 업데이트**: 2025-10-06  
**확인 필요**: `check-portfolio-storage.sql` 실행 결과를 확인해주세요!
