# 워크플로우 구현 가이드

## ✅ 완료된 수정사항

### 1. types/index.ts
- ✅ `bidding-closed` 상태 추가
- ✅ `selected_contractor_id`, `selected_quote_id` 필드 추가
- ✅ 각 상태에 주석 추가로 명확한 워크플로우 정의

### 2. app/admin/quotes/page.tsx
- ✅ 워크플로우 개선:
  - `pending` → `approved` (승인 버튼)
  - `approved` → `site-visit-pending` (현장방문 승인)
  - `site-visit-pending` → **자동으로 `bidding`** (현장방문 완료 + 입찰 시작)
  - `bidding` → `bidding-closed` (입찰 종료)
  - `bidding-closed` → `completed` (프로젝트 완료)
- ✅ 워크플로우 안내 UI 추가
- ✅ 상태별 적절한 버튼 표시

### 3. app/contractor/IntegratedDashboard2.tsx (수정 필요)
**업데이트 예정:**
- 프로젝트 로딩 쿼리 수정:
  - 업체가 참여한 프로젝트: 모든 상태 표시
  - 새 프로젝트: `approved` 상태만 표시
- `bidding-closed` 상태 지원

---

## 📋 남은 작업

### 고우선순위
1. ⏳ **업체 대시보드 프로젝트 필터링**
   - 파일: `app/contractor/IntegratedDashboard2.tsx`
   - 수정 위치: `loadProjects()` 함수의 쿼리 부분
   - 변경사항:
     ```typescript
     // 현재 (잘못된 로직)
     .or(`id.in.(${Array.from(participatingProjectIds).join(',')}),status.eq.pending,status.eq.approved,status.eq.site-visit-pending,status.eq.bidding,status.eq.quote-submitted`)
     
     // 수정 후 (올바른 로직)
     .or(`id.in.(${Array.from(participatingProjectIds).join(',')}),status.eq.approved`)
     ```

2. ⏳ **고객 대시보드 생성**
   - 파일: `app/customer/dashboard/page.tsx` (새로 생성)
   - 기능:
     - 내 프로젝트 목록 표시
     - `bidding` 또는 `bidding-closed` 상태일 때 제출된 견적서 목록 표시
     - 업체 선택 버튼
     - 프로젝트 시작 버튼

3. ⏳ **이메일 발송 API**
   - 파일: `app/api/send-selection-email/route.ts` (새로 생성)
   - 기능:
     - 고객이 업체를 선택하면 자동으로 이메일 발송
     - 이메일 내용: 축하 메시지 + 고객 정보 (이름, 연락처, 주소)
   - Resend 또는 Supabase Edge Function 사용

### 중우선순위
4. ⏳ **데이터베이스 스키마 확인**
   - `quote_requests` 테이블에 `selected_contractor_id`, `selected_quote_id` 컬럼 추가
   - SQL:
     ```sql
     ALTER TABLE quote_requests 
     ADD COLUMN IF NOT EXISTS selected_contractor_id UUID REFERENCES contractors(id),
     ADD COLUMN IF NOT EXISTS selected_quote_id UUID REFERENCES contractor_quotes(id);
     ```

5. ⏳ **고객 대시보드 라우팅**
   - 파일: `app/customer/page.tsx`
   - 고객이 로그인하면 자동으로 대시보드로 리다이렉트

### 저우선순위
6. 알림 시스템
7. 이메일 발송 내역 관리
8. 통계 및 분석

---

## 🎯 다음 단계

### 즉시 수정 (5분)
1. 업체 대시보드 프로젝트 필터링 수정

### 단계별 구현 (30분)
2. 고객 대시보드 기본 UI 생성
3. 업체 선택 기능 구현
4. 이메일 발송 API 생성

### 테스트 (10분)
5. 전체 워크플로우 테스트
   - 고객: 견적요청서 제출
   - 관리자: 승인 → 현장방문 완료 → 입찰 시작
   - 업체: 견적서 제출
   - 고객: 업체 선택
   - 이메일 발송 확인
   - 고객: 프로젝트 시작

---

## 📝 워크플로우 요약

```
[고객] 견적요청서 제출
     ↓
  pending
     ↓
[관리자] 승인 버튼 클릭
     ↓
  approved ← [업체] 프로젝트 목록에 표시됨
     ↓
[업체] 현장방문 신청
     ↓
site-visit-pending
     ↓
[관리자] 현장방문 완료 + 입찰 시작 버튼 클릭
     ↓
  bidding (자동 전환) ← [업체] 견적서 제출 가능
     ↓
[관리자] 입찰 종료 OR [고객] 업체 선택
     ↓
bidding-closed
     ↓
[선택된 업체] 축하 이메일 발송 (고객 정보 포함)
     ↓
[고객] 프로젝트 시작 버튼 클릭
     ↓
  completed
```

---

## 🔧 수정 예시 코드

### 업체 대시보드 프로젝트 로딩 쿼리

```typescript
// app/contractor/IntegratedDashboard2.tsx
const loadProjects = useCallback(async () => {
  // ... 기존 코드 ...
  
  // ✅ 수정된 쿼리
  const { data: projectsData, error: projectsError } = await supabase
    .from('quote_requests')
    .select('*, selected_contractor_id, selected_quote_id')
    .or(
      `id.in.(${Array.from(participatingProjectIds).join(',')}),` + // 참여한 프로젝트
      `status.eq.approved`  // 새 프로젝트는 approved만
    )
    .order('created_at', { ascending: false })
    
  // ... 나머지 코드 ...
}, [contractorData])
```

### 고객이 업체 선택하는 API

```typescript
// app/api/select-contractor/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId, quoteId } = await request.json()
    const supabase = createServerClient()
    
    // 1. 프로젝트 상태 업데이트
    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'bidding-closed',
        selected_contractor_id: contractorId,
        selected_quote_id: quoteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (updateError) throw updateError
    
    // 2. 이메일 발송 API 호출
    await fetch('/api/send-selection-email', {
      method: 'POST',
      body: JSON.stringify({ projectId, contractorId })
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## ⚠️ 중요 참고사항

1. **approved 상태의 중요성**
   - 고객이 견적요청서를 제출하면 `pending` 상태
   - 관리자가 승인하면 `approved` 상태
   - **`approved` 상태만 업체의 프로젝트 목록에 표시됨**
   - 업체가 참여한 프로젝트는 모든 상태에서 표시됨

2. **현장방문 완료 → 입찰 자동 시작**
   - 관리자가 "현장방문 완료 + 입찰 시작" 버튼을 클릭
   - 자동으로 `bidding` 상태로 변경
   - 업체들이 견적서를 제출할 수 있음

3. **입찰 종료**
   - 관리자가 "입찰 종료" 버튼 클릭 → `bidding-closed`
   - 고객이 업체 선택 → `bidding-closed` + 이메일 발송

4. **프로젝트 완료**
   - 고객이 "프로젝트 시작" 버튼 클릭
   - `completed` 상태로 변경
   - 업체와 관리자에게 표시됨
