# 업체 대시보드 프로젝트 필터링 수정 가이드

## 🎯 목표
업체가 참여하지 않은 새로운 프로젝트는 **`approved` 상태만** 표시되도록 수정

## 📍 수정할 파일
`app/contractor/IntegratedDashboard2.tsx`

## 🔧 수정할 위치
`loadProjects` 함수 내부의 쿼리 부분 (약 80-110줄 사이)

## ❌ 현재 코드 (잘못된 로직)
```typescript
// ✅ 2. 모든 견적요청서 가져오기 (pending 포함!)
const { data: projectsData, error: projectsError } = await supabase
  .from('quote_requests')
  .select('*, selected_contractor_id, selected_quote_id')
  .or(`id.in.(${Array.from(participatingProjectIds).join(',')}),status.eq.pending,status.eq.approved,status.eq.site-visit-pending,status.eq.bidding,status.eq.quote-submitted`)
  .order('created_at', { ascending: false })
```

## ✅ 수정 후 코드 (올바른 로직)
```typescript
// ✅ 2. 프로젝트 가져오기: 참여한 프로젝트 + approved 상태 프로젝트만
let projectsData = []
let projectsError = null

if (participatingProjectIds.size > 0) {
  // 참여한 프로젝트가 있으면 OR 조건 사용
  const result = await supabase
    .from('quote_requests')
    .select('*, selected_contractor_id, selected_quote_id')
    .or(`id.in.(${Array.from(participatingProjectIds).join(',')}),status.eq.approved`)
    .order('created_at', { ascending: false })
  
  projectsData = result.data
  projectsError = result.error
} else {
  // 참여한 프로젝트가 없으면 approved만 가져오기
  const result = await supabase
    .from('quote_requests')
    .select('*, selected_contractor_id, selected_quote_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  
  projectsData = result.data
  projectsError = result.error
}
```

## 📝 설명

### 이전 동작
- `pending`, `approved`, `site-visit-pending`, `bidding`, `quote-submitted` 모든 상태 표시
- 업체가 참여하지 않은 프로젝트도 여러 상태에서 보임

### 수정 후 동작
- **업체가 참여한 프로젝트**: 모든 상태에서 표시 (현장방문 신청 또는 견적서 제출한 프로젝트)
- **새로운 프로젝트**: `approved` 상태만 표시

### 워크플로우
```
고객이 견적요청서 제출 → pending (업체에게 안 보임)
↓
관리자가 승인 → approved (업체에게 보임! ⭐)
↓
업체가 현장방문 신청 → site-visit-pending (참여했으므로 계속 보임)
↓
... 이후 모든 상태에서 계속 보임
```

## 🚀 수정 후 테스트
1. 관리자: 견적요청서를 `approved`로 승인
2. 업체 대시보드: 새로 승인된 프로젝트가 표시됨
3. 업체: 현장방문 신청
4. 프로젝트가 계속 업체 대시보드에 표시됨 (모든 상태에서)

## ⚠️ 주의사항
- `participatingProjectIds`가 비어있을 때 `.or()` 조건에 빈 배열을 넣으면 쿼리 오류 발생
- 위의 if-else 분기 처리로 해결

## 💡 대안 (더 간단한 방법)
Supabase의 쿼리 빌더 특성상 아래 방식도 가능:

```typescript
let query = supabase
  .from('quote_requests')
  .select('*, selected_contractor_id, selected_quote_id')

if (participatingProjectIds.size > 0) {
  query = query.or(`id.in.(${Array.from(participatingProjectIds).join(',')}),status.eq.approved`)
} else {
  query = query.eq('status', 'approved')
}

const { data: projectsData, error: projectsError } = await query.order('created_at', { ascending: false })
```

---

## 📦 전체 수정 파일
전체 수정된 파일이 필요하시면 요청해주세요!
