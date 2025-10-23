# 이벤트 관리 시스템 설치 가이드

이 가이드는 이벤트 관리 시스템을 설치하고 설정하는 방법을 설명합니다.

## 📋 목차
1. [데이터베이스 설정](#데이터베이스-설정)
2. [파일 구조](#파일-구조)
3. [기능 설명](#기능-설명)
4. [사용 방법](#사용-방법)

## 🗄️ 데이터베이스 설정

### 1. SQL 파일 실행

Supabase SQL Editor에서 다음 파일을 실행하세요:

```bash
create-events-table.sql
```

이 스크립트는 다음을 수행합니다:
- `events` 테이블 생성
- 필요한 인덱스 생성
- RLS (Row Level Security) 정책 설정
- 트리거 생성 (updated_at 자동 업데이트)

### 2. 테이블 스키마

```sql
events 테이블:
├── id (UUID) - 고유 식별자
├── contractor_id (UUID) - 업체 ID (외래키)
├── title (VARCHAR) - 제목
├── subtitle (VARCHAR) - 부제목
├── description (TEXT) - 설명
├── type (VARCHAR) - 이벤트 타입 (discount, gift, special, season, collaboration)
├── discount_rate (INTEGER) - 할인율
├── original_price (BIGINT) - 정상가
├── discounted_price (BIGINT) - 할인가
├── image_url (TEXT) - 이미지 URL
├── thumbnail_url (TEXT) - 썸네일 URL
├── start_date (DATE) - 시작일
├── end_date (DATE) - 종료일
├── is_featured (BOOLEAN) - 특별 이벤트 여부
├── is_active (BOOLEAN) - 활성화 여부
├── terms_conditions (JSONB) - 이용 조건
├── target_space (JSONB) - 대상 공간
├── min_budget (BIGINT) - 최소 예산
├── max_participants (INTEGER) - 최대 참여자
├── current_participants (INTEGER) - 현재 참여자
├── tags (JSONB) - 태그
├── created_at (TIMESTAMP) - 생성일
└── updated_at (TIMESTAMP) - 수정일
```

## 📁 파일 구조

### 생성된 파일들

```
cb1/
├── create-events-table.sql          # 데이터베이스 테이블 생성 SQL
├── app/
│   ├── api/
│   │   └── events/
│   │       └── route.ts             # API 라우트 (CRUD)
│   ├── admin/
│   │   └── events/
│   │       └── page.tsx             # 관리자 페이지
│   └── events/
│       └── page.tsx                 # 사용자 페이지 (업데이트됨)
```

### API 라우트 (`app/api/events/route.ts`)

다음 엔드포인트를 제공합니다:

- **GET** `/api/events` - 이벤트 목록 조회
  - 쿼리 파라미터:
    - `type`: 이벤트 타입 필터
    - `status`: 상태 필터 (ongoing, upcoming, ended)
    - `featured`: 특별 이벤트만 조회 (true/false)
    - `contractorId`: 특정 업체의 이벤트만 조회

- **POST** `/api/events` - 새 이벤트 생성
  - 관리자 또는 업체만 가능
  - 요청 본문: Event 객체

- **PUT** `/api/events` - 이벤트 수정
  - 관리자 또는 해당 업체만 가능
  - 요청 본문: { id: string, ...업데이트할 필드 }

- **DELETE** `/api/events?id={eventId}` - 이벤트 삭제
  - 관리자 또는 해당 업체만 가능

### 관리자 페이지 (`app/admin/events/page.tsx`)

기능:
- 이벤트 목록 조회 (테이블 형식)
- 이벤트 추가/수정/삭제
- 모달을 통한 폼 입력
- 실시간 알림 (성공/에러)
- 업체별 필터링

### 사용자 페이지 (`app/events/page.tsx`)

기능:
- 이벤트 목록 조회 (카드 형식)
- 상태별 필터링 (진행중/예정/종료)
- 타입별 필터링
- 이벤트 상세 모달
- D-Day 표시
- 참여 현황 표시

## 🎯 기능 설명

### 1. 이벤트 타입

- **할인 (discount)**: 할인율과 가격 정보 포함
- **증정 (gift)**: 경품이나 사은품 제공
- **특별 (special)**: 특별한 조건의 이벤트
- **시즌 (season)**: 계절별 특가
- **제휴 (collaboration)**: 제휴사 할인

### 2. 권한 관리

RLS 정책을 통해 자동으로 관리됩니다:

- **일반 사용자**: 활성화된 이벤트만 조회 가능
- **업체**: 본인의 이벤트 생성/수정/삭제 가능
- **관리자**: 모든 이벤트 관리 가능

### 3. 자동 기능

- `updated_at` 자동 업데이트
- 날짜 유효성 검사
- 가격 유효성 검사
- 참여자 수 제한 검사

## 🚀 사용 방법

### 1. 관리자로 이벤트 추가

1. `/admin/events` 페이지 접속
2. "이벤트 추가" 버튼 클릭
3. 폼 작성:
   - 기본 정보 (제목, 설명)
   - 이벤트 타입 선택
   - 이미지 URL 입력
   - 기간 설정
   - 추가 옵션 설정 (할인율, 참여 제한 등)
4. "추가하기" 버튼 클릭

### 2. 업체가 이벤트 추가

업체 로그인 상태에서:
1. `/admin/events` 페이지 접속
2. 자동으로 본인의 업체 ID가 설정됨
3. 이벤트 생성 (관리자와 동일한 프로세스)

### 3. 이벤트 수정/삭제

1. 이벤트 목록에서 수정/삭제 버튼 클릭
2. 수정: 폼에서 내용 변경 후 "수정하기"
3. 삭제: 확인 메시지 후 삭제

### 4. 사용자 페이지에서 이벤트 확인

1. `/events` 페이지 접속
2. 상태별/타입별 필터 사용
3. 이벤트 카드 클릭하여 상세 정보 확인

## 🔧 커스터마이징

### 이벤트 타입 추가

1. `create-events-table.sql`에서 CHECK 제약 수정:
```sql
CHECK (type IN ('discount', 'gift', 'special', 'season', 'collaboration', '새타입'))
```

2. TypeScript 타입 수정:
```typescript
type: 'discount' | 'gift' | 'special' | 'season' | 'collaboration' | '새타입'
```

3. 라벨 추가:
```typescript
const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    // ... 기존 타입들
    '새타입': '새타입_한글명'
  }
  return labels[type] || type
}
```

### 이미지 업로드 추가

현재는 URL을 직접 입력하는 방식이지만, Supabase Storage를 사용하여 이미지를 업로드할 수 있습니다:

1. Supabase Storage에 `event-images` 버킷 생성
2. 파일 업로드 컴포넌트 추가
3. 업로드 후 URL을 `image_url` 필드에 저장

## ⚠️ 주의사항

1. **날짜 설정**: 종료일은 시작일보다 늦어야 합니다
2. **가격 정보**: 정상가와 할인가를 함께 입력하거나 둘 다 비워야 합니다
3. **참여 제한**: 최대 참여자를 설정하면 현재 참여자가 자동으로 0으로 초기화됩니다
4. **이미지**: 유효한 이미지 URL을 입력해야 합니다

## 🐛 문제 해결

### API 호출 실패

1. Supabase 연결 확인
2. 환경 변수 확인 (.env.local)
3. RLS 정책 확인

### 권한 에러

1. 사용자 로그인 상태 확인
2. `users` 테이블에 `user_type` 확인
3. RLS 정책 재확인

### 이미지 표시 안됨

1. 이미지 URL 유효성 확인
2. CORS 설정 확인
3. 이미지 형식 확인 (jpg, png, webp 등)

## 📝 추가 기능 제안

1. **이미지 업로드**: Supabase Storage 통합
2. **참여 신청**: 사용자가 직접 이벤트에 참여
3. **알림**: 이벤트 시작/종료 알림
4. **통계**: 이벤트별 조회수, 참여율 등
5. **쿠폰 코드**: 이벤트별 쿠폰 생성
6. **SNS 공유**: 이벤트 공유 기능

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 로그
2. 브라우저 콘솔
3. Network 탭 (API 요청 확인)

---

이 시스템은 완전히 작동하며 바로 사용할 수 있습니다! 🎉
