# 프로젝트 시작 기능 구현 가이드

## 📋 개요

고객이 업체 선정 후 프로젝트를 공식적으로 시작할 수 있는 기능이 추가되었습니다.

## 🔄 워크플로우

### 기존 플로우
```
견적 요청 → 업체 선정 → ❌ 바로 완료 (completed)
```

### 개선된 플로우
```
견적 요청 → 업체 선정 (contractor-selected) 
→ 업체 연락 및 일정 조율 
→ 고객이 "프로젝트 시작" 버튼 클릭 (in-progress) 
→ 공사 진행 
→ 완료 (completed)
```

## 🎯 주요 변경 사항

### 1. 새로운 프로젝트 상태 추가

| 상태 | 설명 | 이전 | 변경 후 |
|------|------|------|---------|
| `contractor-selected` | 업체 선정 완료 | ❌ | ✅ NEW |
| `in-progress` | 공사 진행 중 | ❌ | ✅ NEW |
| `completed` | 공사 완료 | ✅ 업체 선정 시 | ✅ 실제 완료 시 |

### 2. 데이터베이스 변경

**새로운 필드 추가:**
- `project_started_at` - 프로젝트 시작 시간
- `project_completed_at` - 프로젝트 완료 시간

**상태 제약조건 업데이트:**
```sql
ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending', 'approved', 'site-visit-pending', 
  'site-visit-completed', 'bidding', 'quote-submitted',
  'contractor-selected',  -- NEW!
  'in-progress',          -- NEW!
  'completed', 'cancelled'
));
```

### 3. API 엔드포인트

#### 새로 추가된 API

**POST `/api/start-project`**
- 프로젝트를 `contractor-selected` → `in-progress`로 변경
- `project_started_at` 타임스탬프 기록
- 업체에게 프로젝트 시작 알림 이메일 발송

**Request:**
```json
{
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "프로젝트가 시작되었습니다",
  "projectStatus": "in-progress",
  "startedAt": "2024-01-01T00:00:00Z"
}
```

#### 수정된 API

**POST `/api/contractor-selection`**
- 변경 전: 상태를 `completed`로 변경
- 변경 후: 상태를 `contractor-selected`로 변경
- 고객에게 "업체가 연락드릴 예정입니다" 안내

### 4. UI 개선

**고객 대시보드 (`/my-quotes`)**

✅ **contractor-selected 상태일 때:**
```
┌─────────────────────────────────────────┐
│ ✓ 업체 선정이 완료되었습니다              │
│                                          │
│ 선정된 업체가 곧 연락드릴 예정입니다.    │
│ 업체와 일정을 조율하신 후 아래 버튼을    │
│ 눌러 프로젝트를 시작해주세요.            │
│                                          │
│    [🚀 프로젝트 시작]                     │
└─────────────────────────────────────────┘
```

✅ **in-progress 상태일 때:**
```
┌─────────────────────────────────────────┐
│ ▶ 프로젝트 진행 중                       │
│                                          │
│ 현재 공사가 진행 중입니다.               │
│ 시작일: 2024-01-01                       │
└─────────────────────────────────────────┘
```

✅ **completed 상태일 때:**
```
┌─────────────────────────────────────────┐
│ ✓ 프로젝트 완료                          │
│                                          │
│ 프로젝트가 성공적으로 완료되었습니다.    │
│ 완료일: 2024-01-01                       │
└─────────────────────────────────────────┘
```

### 5. 이메일 개선

**업체 선정 이메일 (업체에게):**
- ✅ 고객 전화번호 표시 (있는 경우)
- ✅ 전화번호 없을 경우 안내 메시지
- ✅ 수수료 정책 명확화 (30일 이내 지급)

**프로젝트 시작 이메일 (업체에게):**
- 🚀 프로젝트가 공식적으로 시작되었음을 알림
- 시작일, 프로젝트 정보 포함
- 다음 단계 안내

## 🚀 배포 가이드

### 1. 데이터베이스 업데이트

Supabase SQL Editor에서 실행:

```bash
# 파일 실행
update-project-status-schema.sql
```

또는 직접 실행:

```sql
-- 제약조건 업데이트
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending', 'approved', 'site-visit-pending', 
  'site-visit-completed', 'bidding', 'quote-submitted',
  'contractor-selected', 'in-progress', 'completed', 'cancelled'
));

-- 새 필드 추가
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS project_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS project_completed_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_quote_requests_project_started_at 
ON quote_requests(project_started_at);

CREATE INDEX IF NOT EXISTS idx_quote_requests_project_completed_at 
ON quote_requests(project_completed_at);
```

### 2. 기존 데이터 마이그레이션 (선택사항)

기존에 `completed` 상태인 프로젝트 중 아직 시작하지 않은 프로젝트를 `contractor-selected`로 변경:

```sql
-- 주의: 실제 완료된 프로젝트와 구분 필요
-- 수동으로 확인 후 실행 권장
UPDATE quote_requests
SET status = 'contractor-selected'
WHERE status = 'completed'
AND selected_contractor_id IS NOT NULL
AND project_started_at IS NULL;
```

### 3. 애플리케이션 배포

```bash
# 저장소 업데이트
git pull origin main

# 의존성 설치 (필요한 경우)
npm install

# 빌드
npm run build

# 배포
# Vercel/Netlify 등 자동 배포 설정된 경우 자동으로 배포됨
```

### 4. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=canadabeaver.pro
MAILGUN_DOMAIN_URL=https://api.mailgun.net

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. 테스트

1. **업체 선정 테스트:**
   - 견적서를 제출한 프로젝트에서 업체 선택
   - 상태가 `contractor-selected`로 변경되는지 확인
   - 이메일 발송 확인

2. **프로젝트 시작 테스트:**
   - "프로젝트 시작" 버튼이 표시되는지 확인
   - 버튼 클릭 시 상태가 `in-progress`로 변경되는지 확인
   - 업체에게 시작 알림 이메일 발송 확인

3. **UI 상태 표시 테스트:**
   - `contractor-selected`: 시작 버튼 표시
   - `in-progress`: 진행 중 표시
   - `completed`: 완료 표시

## 📊 상태 다이어그램

```
pending
   ↓
approved
   ↓
site-visit-pending
   ↓
site-visit-completed
   ↓
bidding
   ↓
quote-submitted
   ↓
contractor-selected  ← 업체 선정 (고객이 업체 선택)
   ↓
in-progress         ← 프로젝트 시작 (고객이 시작 버튼 클릭)
   ↓
completed           ← 프로젝트 완료
```

## 🐛 문제 해결

### 프로젝트 시작 버튼이 보이지 않음

**원인:** 상태가 `contractor-selected`가 아님

**해결:**
```sql
-- 프로젝트 상태 확인
SELECT id, status, selected_contractor_id 
FROM quote_requests 
WHERE id = 'your-project-id';

-- 필요시 수동으로 상태 변경
UPDATE quote_requests 
SET status = 'contractor-selected'
WHERE id = 'your-project-id';
```

### 데이터베이스 제약조건 오류

**오류:** `새로운 행이 관계 "quote_requests"의 체크 제약조건을 위반했습니다`

**해결:**
```sql
-- 제약조건 확인
SELECT conname, contype, convalidated 
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass;

-- 제약조건 재생성
ALTER TABLE quote_requests 
DROP CONSTRAINT quote_requests_status_check;

-- 위의 스키마 업데이트 SQL 재실행
```

### 이메일이 발송되지 않음

1. Mailgun 설정 확인
2. DMARC 레코드 설정 확인 (중요!)
3. 서버 로그 확인: `npm run dev`

## 📝 추가 개선 사항

### 완료 예정 기능

1. **프로젝트 완료 버튼**
   - 업체 또는 고객이 프로젝트 완료 처리
   - `in-progress` → `completed`
   - `project_completed_at` 타임스탬프 기록

2. **진행 상황 업데이트**
   - 업체가 진행 상황을 업데이트할 수 있는 UI
   - 고객이 진행 상황을 확인할 수 있는 타임라인

3. **리뷰 시스템**
   - 프로젝트 완료 후 고객이 업체 리뷰 작성
   - 별점 및 코멘트

## 🔗 관련 파일

- `app/api/start-project/route.ts` - 프로젝트 시작 API
- `app/api/contractor-selection/route.ts` - 업체 선정 API (수정)
- `app/my-quotes/page.tsx` - 고객 대시보드 (UI 추가)
- `lib/email/mailgun.ts` - 이메일 템플릿 (개선)
- `update-project-status-schema.sql` - 데이터베이스 스키마

## 📞 지원

문제가 발생하면 GitHub Issues에 등록하거나 개발팀에 문의하세요.

---

**최종 업데이트:** 2024-10-19  
**버전:** 2.0.0
