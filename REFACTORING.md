# 프로젝트 리팩토링 구조

## 📁 새로운 파일 구조

```
types/
├── index.ts                    # 중앙화된 타입 정의

lib/
├── supabase/
│   └── hooks.ts               # 재사용 가능한 Supabase 훅
└── project-status.ts          # 프로젝트 상태 관리 유틸

services/
└── project.service.ts         # 프로젝트 관련 API 서비스

components/
└── StatusBadge.tsx           # 재사용 가능한 상태 배지 컴포넌트

hooks/
└── useProjects.ts            # 프로젝트 관리 커스텀 훅

app/
├── api/
│   ├── projects/
│   │   └── status/route.ts   # 프로젝트 상태 변경 API
│   └── quotes/
│       └── submit/route.ts   # 견적서 제출 API
└── contractor/
    └── page-refactored.tsx   # 리팩토링된 업체 대시보드
```

## 🔧 주요 개선사항

### 1. **타입 안전성**
- 모든 타입을 `types/index.ts`에서 중앙 관리
- TypeScript로 완전한 타입 안전성 보장

### 2. **상태 관리 개선**
- `lib/project-status.ts`에서 상태 상수, 라벨, 색상 중앙 관리
- 상태 전환 규칙 정의

### 3. **서비스 레이어 분리**
- `services/project.service.ts`에서 모든 프로젝트 관련 API 로직 분리
- 재사용 가능한 서비스 클래스

### 4. **커스텀 훅**
- `hooks/useProjects.ts`로 프로젝트 데이터 관리 로직 분리
- `lib/supabase/hooks.ts`로 인증 로직 재사용

### 5. **API 라우트 개선**
- `/api/projects/status` - 프로젝트 상태 변경
- `/api/quotes/submit` - 견적서 제출 (현장방문 완료 체크 포함)

## 🚀 사용법

### 기본 사용
```typescript
import { useProjects } from '@/hooks/useProjects'
import { StatusBadge } from '@/components/StatusBadge'

const { projects, loading, refresh } = useProjects(contractorId)
```

### 상태 변경
```typescript
import { ProjectService } from '@/services/project.service'

const service = new ProjectService()
await service.updateProjectStatus(projectId, 'bidding')
```

### 견적서 제출
```typescript
await service.submitQuote(projectId, contractorId, {
  price: 50000,
  description: '상세 설명',
  pdf_url: 'file.pdf',
  pdf_filename: '견적서.pdf'
})
```

## 🔄 상태 흐름

```
pending → approved → site-visit-pending → site-visit-completed → bidding → quote-submitted → completed
```

## ✅ 해결된 문제들

1. **비딩 상태 변경 API 추가**
2. **견적서 제출 시 현장방문 완료 체크**
3. **타입 안전성 보장**
4. **코드 재사용성 향상**
5. **상태 관리 중앙화**
