# 수수료 관리 시스템 가이드

## 📋 개요

관리자 대시보드에 프로젝트 수수료를 추적하고 관리하는 새로운 기능이 추가되었습니다. 고객이 프로젝트를 시작하면 자동으로 수수료가 추적되며, 관리자가 수동으로 확인하고 관리할 수 있습니다.

## 🚀 설치 방법

### 1. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 파일들을 **순서대로** 실행하세요:

#### Step 1: 기본 테이블 생성
```sql
-- create-commission-management-table.sql 파일의 내용을 실행
```

#### Step 2: 중복 방지 기능 추가 ⭐ 중요!
```sql
-- fix-commission-duplicate-prevention.sql 파일의 내용을 실행
```

이 스크립트들은 다음을 생성합니다:
- `commission_tracking` 테이블
- 필요한 인덱스
- RLS (Row Level Security) 정책
- 자동 업데이트 트리거
- **중복 방지 제약조건 (UNIQUE constraint)**
- **중복 체크 로직**

### 2. 코드 배포

변경된 파일들:
- `app/admin/page.tsx` - 관리자 대시보드 (시스템 설정 → 수수료 관리)
- `app/admin/commission/page.tsx` - 새로운 수수료 관리 페이지

## 🛡️ 중복 방지 시스템

### 문제 상황
```
1. 관리자가 수동으로 프로젝트 A 수수료 등록 ✅
2. 나중에 고객이 같은 프로젝트 A에서 "프로젝트 시작" 버튼 클릭
3. ❌ 중복 생성 위험!
```

### 해결 방법 ✅

**3중 보호 장치:**

1. **UNIQUE 제약조건**
   - `quote_request_id`에 UNIQUE 제약조건 설정
   - 데이터베이스 레벨에서 중복 차단

2. **트리거 중복 체크**
   - INSERT 전에 이미 존재하는지 확인
   - 존재하면 건너뛰고 로그 남김

3. **프론트엔드 필터링**
   - 수동 등록 시 이미 추적 중인 프로젝트는 목록에서 제외

### 작동 방식

```sql
-- 시나리오 1: 관리자가 먼저 수동 등록
관리자: 수동 등록 → INSERT 성공 ✅
고객: 버튼 클릭 → 트리거 실행 → 이미 존재 확인 → 건너뜀 ✅

-- 시나리오 2: 고객이 먼저 버튼 클릭
고객: 버튼 클릭 → 트리거 실행 → INSERT 성공 ✅
관리자: 수동 등록 시도 → 목록에 안보임 ✅

-- 시나리오 3: 동시 실행 (극히 드문 경우)
동시 INSERT 시도 → UNIQUE 제약조건으로 차단 → 하나만 성공 ✅
```

## 📊 주요 기능

### 1. 자동 수수료 추적 ✅
- 고객이 프로젝트 시작 버튼을 누르면 (`in-progress` 상태로 변경)
- 자동으로 `commission_tracking` 테이블에 레코드가 생성됩니다
- 견적 금액의 10%가 수수료로 자동 계산됩니다
- **중복 방지**: 이미 수수료 추적이 있으면 생성하지 않음

### 2. 수동 수수료 등록 ⭐
- "수동 등록" 버튼으로 관리자가 직접 추가 가능
- 고객이 버튼을 누르지 않았지만 프로젝트가 시작된 경우 사용
- 업체로부터 프로젝트 시작 확인을 받은 후 등록
- **중복 방지**: 이미 추적 중인 프로젝트는 목록에서 제외

### 3. 수수료 정보
다음 정보가 자동으로 저장됩니다:
- ✅ 업체명
- ✅ 프로젝트 제목
- ✅ 견적 금액
- ✅ 수수료 비율 (기본 10%)
- ✅ 수수료 금액
- ✅ 프로젝트 시작 날짜
- ✅ 수수료 상태 (미수령/수령완료)
- ✅ 등록 방법 (자동/수동)

### 4. 관리자 기능

#### 수수료 상태 관리
- **미수령 → 수령완료**: "수령완료" 버튼 클릭
- **수령완료 → 미수령**: "취소" 버튼 클릭

#### 메모 추가
- 각 수수료 항목에 메모를 추가할 수 있습니다
- 결제 관련 특이사항이나 참고사항 기록 가능

#### 필터링
- **전체**: 모든 수수료 내역
- **미수령**: 아직 받지 못한 수수료
- **수령완료**: 이미 받은 수수료

### 5. 대시보드 통계
관리자 대시보드에 새로운 통계 카드가 추가되었습니다:
- 미수령 수수료 총액 (CAD)
- 미수령 건수

## 🎯 사용 시나리오

### 시나리오 1: 정상 프로세스 (자동)
```
1. 고객이 견적서를 받음
2. 고객이 "프로젝트 시작" 버튼 클릭
3. ✅ 자동으로 수수료 추적 생성
4. 관리자가 수수료 관리 페이지에서 확인
5. 업체로부터 수수료 수령
6. 관리자가 "수령완료" 버튼 클릭
```

### 시나리오 2: 수동 등록 후 자동 시도 ⭐
```
1. 고객이 수리 견적 요청
2. 4개 업체가 견적 제출
3. 고객이 "Pacas" 업체 선택
4. 고객이 "프로젝트 시작" 버튼을 누르지 않음 ⚠️
5. Pacas로부터 "프로젝트 시작" 이메일 수신 📧
6. 관리자가 수동으로 수수료 등록 ✅
7. 나중에 고객이 "프로젝트 시작" 버튼 클릭
8. ✅ 시스템이 이미 존재함을 감지 → 중복 생성 안됨!
```

### 시나리오 3: 자동 생성 후 수동 시도
```
1. 고객이 "프로젝트 시작" 버튼 클릭
2. ✅ 자동으로 수수료 추적 생성
3. 관리자가 확인하지 못하고 수동 등록 시도
4. ✅ 해당 프로젝트가 목록에 안보임 (이미 추적 중)
```

## 📱 수동 등록 사용 방법

### 1단계: 수동 등록 버튼 클릭
수수료 관리 페이지 우측 상단의 "수동 등록" 버튼을 클릭합니다.

### 2단계: 프로젝트 선택
- 드롭다운에서 프로젝트를 선택합니다
- **등록 가능한 프로젝트 조건:**
  - 업체가 선택된 프로젝트 (selected_contractor_quote_id가 있음)
  - 아직 수수료 추적이 생성되지 않은 프로젝트 ⭐

### 3단계: 업체 견적 선택
- 선택한 프로젝트의 견적서 목록이 표시됩니다
- 라디오 버튼으로 업체 선택
- 각 견적서에 수수료 금액이 표시됩니다

### 4단계: 시작일 입력
- 프로젝트 시작 날짜를 입력합니다
- 보통 업체로부터 확인받은 날짜를 입력합니다

### 5단계: 등록하기
- "등록하기" 버튼 클릭
- 성공 메시지 확인
- 수수료 목록에 "(수동 등록)" 표시와 함께 추가됨

## 🔧 데이터베이스 스키마

### commission_tracking 테이블

```sql
CREATE TABLE commission_tracking (
  id UUID PRIMARY KEY,
  quote_request_id UUID REFERENCES quote_requests(id) UNIQUE, -- ⭐ UNIQUE!
  contractor_id UUID REFERENCES contractors(id),
  contractor_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  quote_amount DECIMAL(12, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  commission_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  marked_manually BOOLEAN DEFAULT false,
  payment_received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지 제약조건
  CONSTRAINT unique_quote_request_commission UNIQUE (quote_request_id)
);
```

### marked_manually 필드
- `true`: 관리자가 수동으로 등록
- `false`: 고객이 버튼을 눌러 자동 생성

## 🔐 보안

- RLS (Row Level Security) 활성화
- 관리자 이메일(`cmgg919@gmail.com`)만 접근 가능
- 모든 작업에 대한 권한 검증
- **중복 생성 방지 (UNIQUE 제약조건)**

## 📊 자동 vs 수동 비교

| 구분 | 자동 추적 | 수동 등록 |
|------|----------|----------|
| **생성 조건** | 고객이 "프로젝트 시작" 버튼 클릭 | 관리자가 "수동 등록" 버튼 클릭 |
| **marked_manually** | false | true |
| **표시** | 업체명만 표시 | 업체명 + "(수동 등록)" |
| **사용 시기** | 정상적인 프로세스 | 고객이 버튼을 누르지 않은 경우 |
| **시작일** | 버튼을 누른 시간 | 관리자가 입력한 날짜 |
| **중복 방지** | 트리거에서 체크 | 목록에서 제외 |

## 🎓 베스트 프랙티스

### 수동 등록 시 주의사항

1. **확인 후 등록**
   - 반드시 업체로부터 프로젝트 시작 확인을 받은 후 등록
   - 이메일, 전화 등 증거 자료 확보

2. **정확한 날짜 입력**
   - 실제 프로젝트 시작일을 입력
   - 보통 업체가 알려준 날짜 사용

3. **메모 활용**
   - "업체 이메일로 확인 (2025-01-15)"
   - "전화로 프로젝트 시작 확인"
   - 등 참고사항 기록

4. **중복 걱정 NO!**
   - 시스템이 자동으로 중복을 방지합니다
   - 이미 추적 중인 프로젝트는 목록에 나타나지 않습니다
   - 설사 실수로 시도해도 데이터베이스가 차단합니다

## 📈 향후 개선 사항

1. ~~**수동 등록 기능**~~ ✅ 완료
2. ~~**중복 방지 기능**~~ ✅ 완료
3. **수수료 비율 조정**
   - 업체별 또는 프로젝트별 수수료 비율 설정
4. **엑셀 내보내기**
   - 회계 처리를 위한 데이터 내보내기
5. **알림 기능**
   - 새로운 수수료 발생 시 이메일 알림
   - 장기 미수령 수수료 경고
6. **통계 및 리포트**
   - 월별/분기별 수수료 통계
   - 업체별 수수료 분석

## ❓ 문제 해결

### 중복이 생성되었나요?

중복 확인 쿼리를 실행하세요:

```sql
-- 중복 체크
SELECT 
  quote_request_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as commission_ids
FROM commission_tracking
GROUP BY quote_request_id
HAVING COUNT(*) > 1;

-- 결과가 없으면 중복이 없는 것입니다!
```

만약 중복이 있다면:

```sql
-- 중복 제거 (최초 생성된 것만 남김)
WITH duplicates AS (
  SELECT 
    id,
    quote_request_id,
    ROW_NUMBER() OVER (PARTITION BY quote_request_id ORDER BY created_at ASC) as rn
  FROM commission_tracking
)
DELETE FROM commission_tracking
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

### 수수료가 자동으로 생성되지 않는 경우

1. **프로젝트 상태 확인**
   ```sql
   SELECT id, title, status, selected_contractor_quote_id 
   FROM quote_requests 
   WHERE id = 'PROJECT_ID';
   ```

2. **트리거 확인**
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trigger_create_commission_on_project_start';
   ```

3. **수동으로 등록**
   - 수수료 관리 페이지에서 "수동 등록" 버튼 사용

### 수동 등록 시 프로젝트가 안보이는 경우

**이는 정상입니다!** 다음 이유 중 하나입니다:

1. 해당 프로젝트에 업체가 선택되지 않음
2. 이미 수수료 추적이 생성됨 (중복 방지)

확인 쿼리:
```sql
SELECT 
  qr.id,
  qr.title,
  qr.selected_contractor_quote_id,
  ct.id as commission_id,
  CASE 
    WHEN ct.id IS NOT NULL THEN '이미 추적 중'
    WHEN qr.selected_contractor_quote_id IS NULL THEN '업체 미선택'
    ELSE '등록 가능'
  END as status
FROM quote_requests qr
LEFT JOIN commission_tracking ct ON qr.id = ct.quote_request_id
WHERE qr.id = 'PROJECT_ID';
```

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.

---

**마지막 업데이트**: 2025-11-06  
**버전**: 2.1.0 (중복 방지 기능 추가)
