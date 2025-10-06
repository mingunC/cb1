# 회사 로고 업로드 및 표시 문제 해결 가이드

## 문제 상황
업체가 프로필 관리 페이지에서 회사 로고를 업로드해도 이미지가 표시되지 않는 문제

## 원인 분석

### 1. 즉시 DB 저장 누락
- 기존 코드는 로고를 업로드한 후 **state에만 저장**하고 DB에는 저장하지 않음
- 사용자가 "저장" 버튼을 눌러야만 DB에 반영됨
- 페이지 새로고침 시 로고가 사라지는 문제 발생

### 2. URL 생성 로직 문제
```typescript
// 문제가 있던 기존 코드
setFormData(prev => ({ ...prev, company_logo: publicUrl }))
// DB 저장 안됨!
```

### 3. 에러 핸들링 부족
- 업로드 실패 시 사용자에게 명확한 피드백 없음
- 디버깅을 위한 로그 부족

## 해결 방법

### 수정된 코드의 주요 변경사항

#### 1. 즉시 DB 저장 로직 추가
```typescript
// 로고 업로드 후 즉시 DB에 저장
const { error: updateError } = await supabase
  .from('contractors')
  .update({ 
    company_logo: publicUrl,
    updated_at: new Date().toISOString()
  })
  .eq('id', profile.id)
```

#### 2. 로딩 상태 추가
```typescript
const [isUploadingLogo, setIsUploadingLogo] = useState(false)

// 업로드 중 UI 표시
{isUploadingLogo ? (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
) : logoPreview ? (
  <img src={logoPreview} alt="Company Logo" />
) : (
  <span>Logo</span>
)}
```

#### 3. 디버깅 로그 추가
```typescript
console.log('로고 업로드 시작:', filePath)
console.log('업로드 성공:', uploadData)
console.log('생성된 Public URL:', publicUrl)
console.log('DB 업데이트 성공')
```

#### 4. 에러 핸들링 강화
```typescript
// 이미지 로드 실패 시 처리
<img 
  src={logoPreview} 
  onError={(e) => {
    console.error('이미지 로드 실패:', logoPreview)
    e.currentTarget.style.display = 'none'
  }}
/>
```

#### 5. 프로필 재로드
```typescript
// 업로드 성공 후 프로필 전체 재로드
await loadProfile()
```

## Supabase Storage 설정 확인 사항

### 1. Storage 버킷 확인
Supabase Dashboard → Storage에서 `portfolios` 버킷이 생성되어 있는지 확인

### 2. 버킷 설정
- **Public 여부**: `true` (공개 버킷)
- **파일 크기 제한**: 10MB
- **허용 MIME 타입**: image/jpeg, image/png, image/webp, image/gif

### 3. Storage 정책 (RLS) 설정
다음 정책들이 설정되어 있어야 합니다:

```sql
-- 1. 업로드 권한
CREATE POLICY "Contractors can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolios' AND
    (storage.foldername(name))[1] = 'contractor-logos'
  );

-- 2. 조회 권한 (공개)
CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolios');

-- 3. 삭제 권한
CREATE POLICY "Contractors can delete their logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolios' AND
    (storage.foldername(name))[1] = 'contractor-logos'
  );
```

### 4. DB 테이블 컬럼 확인
`contractors` 테이블에 `company_logo` 컬럼이 있는지 확인:
```sql
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS company_logo TEXT;
```

## 설치 및 적용 방법

### 1. SQL 스크립트 실행
Supabase Dashboard → SQL Editor에서 다음 스크립트 실행:
```bash
fix-company-logo-storage.sql
```

### 2. 코드 배포
수정된 `app/contractor/profile/page.tsx` 파일을 배포

### 3. 테스트
1. 업체 계정으로 로그인
2. 프로필 관리 페이지 접속
3. 로고 업로드 테스트
4. 페이지 새로고침 후 로고가 유지되는지 확인

## 문제 해결 체크리스트

- [ ] Supabase Storage `portfolios` 버킷 생성됨
- [ ] 버킷이 Public으로 설정됨
- [ ] Storage RLS 정책이 올바르게 설정됨
- [ ] `contractors` 테이블에 `company_logo` 컬럼 존재
- [ ] 수정된 프로필 페이지 코드 배포됨
- [ ] 브라우저 캐시 삭제 후 테스트
- [ ] 개발자 도구에서 콘솔 로그 확인

## 추가 디버깅

문제가 계속되면 브라우저 개발자 도구(F12)에서 다음을 확인:

1. **Console 탭**: 에러 메시지 및 로그 확인
2. **Network 탭**: 
   - Storage 업로드 요청 성공 여부 (200 OK)
   - Public URL 접근 가능 여부
3. **Application 탭**: 
   - Supabase 세션 확인
   - Local Storage 확인

## 자주 발생하는 문제

### 1. "Policy violation" 에러
→ Storage RLS 정책이 올바르게 설정되지 않음
→ `fix-company-logo-storage.sql` 다시 실행

### 2. 이미지 404 에러
→ Public URL이 올바르지 않음
→ Supabase Dashboard에서 버킷이 Public인지 확인

### 3. 업로드는 되지만 표시 안됨
→ DB에 저장되지 않은 것
→ 수정된 코드가 제대로 배포되었는지 확인

## 참고 자료
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Supabase RLS 정책](https://supabase.com/docs/guides/auth/row-level-security)
