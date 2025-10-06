# 프로젝트 워크플로우 및 종료 프로세스

## 📊 현재 워크플로우 분석 결과

### Micks 업체가 선택받은 경우

**중요**: 고객이 업체를 **선택(accepted)**했다고 해서 자동으로 프로젝트가 **종료(completed)**되는 것은 **아닙니다**.

---

## 🔄 전체 프로젝트 워크플로우

### 1. 프로젝트 상태(quote_requests.status)
```
pending (대기중)
  ↓
approved (승인됨)
  ↓
site-visit-pending (현장방문 대기)
  ↓
site-visit-completed (현장방문 완료)
  ↓
bidding (입찰 중)
  ↓
quote-submitted (견적서 제출 완료)
  ↓
selected (업체 선택됨) ⭐ ← Micks가 선택받은 상태
  ↓
completed (프로젝트 완료) ✅ ← 최종 종료 상태
```

### 2. 견적서 상태(contractor_quotes.status)
```
submitted (제출됨)
  ↓
accepted (고객이 선택함) ⭐
  ↓
rejected (거절됨)
```

---

## 📋 Micks가 2번 선택받은 경우

### 현재 상태
1. **`contractor_quotes.status = 'accepted'`** 
   - 고객이 Micks의 견적서를 **선택**했음
   - 2개 프로젝트에서 선택받음

2. **`quote_requests.status = ?`**
   - 프로젝트 자체의 상태는 별도로 관리됨
   - **선택받았다고 자동으로 `completed`가 되지 않음**

### 확인 방법
Supabase SQL Editor에서 다음 쿼리 실행:
```sql
-- check-micks-selected-projects.sql 파일 전체 실행
```

쿼리 8번이 가장 중요:
```sql
-- 8. 선택받은 프로젝트가 'completed'가 아닌 경우 확인
SELECT 
  qr.status as project_status,
  cq.status as quote_status,
  c.company_name,
  qr.full_address,
  CASE 
    WHEN qr.status = 'completed' THEN '✅ 프로젝트 종료됨'
    WHEN qr.status = 'selected' THEN '⚠️ 업체 선택됨 (진행 중)'
    WHEN cq.status = 'accepted' AND qr.status NOT IN ('selected', 'completed') 
      THEN '❌ 선택되었으나 프로젝트 상태 업데이트 필요'
    ELSE '진행 중'
  END as status_check
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
JOIN quote_requests qr ON qr.id = cq.project_id
WHERE c.company_name LIKE '%Micks%'
  AND cq.status = 'accepted';
```

---

## 🎯 프로젝트 종료 프로세스

### 방법 1: 관리자 대시보드 사용 (권장)

1. **관리자 로그인** (cmgg919@gmail.com)
2. **관리자 대시보드 → 프로젝트 관리** (`/admin/projects`)
3. Micks가 선택된 프로젝트 찾기
4. **"상태변경" 버튼** 클릭
5. 현재 상태에 따라 다음 단계 선택:
   - `quote-submitted` → `selected` (업체 선택됨)
   - `selected` → `completed` (프로젝트 완료) ✅

### 방법 2: SQL로 직접 변경

```sql
-- Micks가 선택된 프로젝트를 'completed'로 변경
UPDATE quote_requests
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id IN (
  SELECT cq.project_id
  FROM contractor_quotes cq
  JOIN contractors c ON c.user_id = cq.contractor_id
  WHERE c.company_name LIKE '%Micks%'
    AND cq.status = 'accepted'
);
```

---

## 🔍 상태별 의미

| 상태 | contractor_quotes | quote_requests | 의미 |
|------|-------------------|----------------|------|
| **선택됨** | `accepted` | `quote-submitted` 또는 `selected` | 고객이 업체를 선택했지만 작업 전 |
| **진행 중** | `accepted` | `selected` | 업체가 작업 진행 중 |
| **완료** | `accepted` | `completed` | 프로젝트가 최종 완료됨 ✅ |

---

## ⚠️ 주의사항

### 자동 종료되지 않는 이유
- **품질 관리**: 관리자가 최종 확인 후 종료
- **결제 확인**: 고객 결제 완료 확인
- **작업 완료 검증**: 실제 작업이 완료되었는지 확인

### 현재 구현 상태
1. ✅ **고객 선택**: 자동 (`contractor_quotes.status = 'accepted'`)
2. ⚠️ **프로젝트 종료**: **수동** (`quote_requests.status = 'completed'`)
   - 관리자가 상태 변경 버튼으로 처리
   - 또는 SQL로 직접 변경

---

## 📊 체크리스트

### Micks의 선택된 프로젝트 확인
- [ ] Supabase SQL Editor에서 `check-micks-selected-projects.sql` 실행
- [ ] 쿼리 2번 결과에서 `quote_status = 'accepted'` 확인
- [ ] 쿼리 8번 결과에서 `project_status` 확인

### 프로젝트 종료 처리
- [ ] 관리자 대시보드 접속
- [ ] 프로젝트 관리 페이지 이동
- [ ] 해당 프로젝트의 "상태변경" 버튼 클릭
- [ ] `selected` → `completed` 선택
- [ ] 최종 확인 후 변경

---

## 🤔 자주 묻는 질문

**Q: 고객이 업체를 선택하면 자동으로 프로젝트가 종료되나요?**
A: 아니요. `contractor_quotes.status = 'accepted'`로 변경되지만, 프로젝트 자체는 `quote_requests.status = 'selected'` 상태이며, 관리자가 작업 완료를 확인한 후 `completed`로 변경해야 합니다.

**Q: Micks가 2번 선택받았는데 completed가 안 보이는 이유는?**
A: 정상입니다. `accepted`는 "선택됨"을 의미하고, `completed`는 "작업 완료"를 의미합니다. 관리자가 상태를 변경해야 합니다.

**Q: 자동으로 종료되게 할 수 있나요?**
A: 가능하지만 권장하지 않습니다. 품질 관리와 결제 확인을 위해 관리자의 최종 승인이 필요합니다.

---

## 📞 다음 단계

1. **SQL 실행**: `check-micks-selected-projects.sql`
2. **결과 확인**: 어떤 프로젝트가 어떤 상태인지 파악
3. **상태 업데이트**: 완료된 프로젝트는 `completed`로 변경
4. **필요시**: 자동화 로직 추가 (선택사항)

---

**마지막 업데이트**: 2025-10-06  
**관련 파일**: 
- `check-micks-selected-projects.sql` (필수)
- `app/admin/projects/page.tsx` (관리자 대시보드)
- `create-contractor-quotes-table.sql` (스키마)
