# 수수료 관리 시스템 가이드

## 📋 개요

관리자 대시보드에 프로젝트 수수료를 추적하고 관리하는 새로운 기능이 추가되었습니다. 고객이 프로젝트를 시작하면 자동으로 수수료가 추적되며, 관리자가 수동으로 확인하고 관리할 수 있습니다.

## 🚀 설치 방법

### 1. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 파일을 실행하세요:

```sql
-- create-commission-management-table.sql 파일의 내용을 실행
```

이 스크립트는 다음을 생성합니다:
- `commission_tracking` 테이블
- 필요한 인덱스
- RLS (Row Level Security) 정책
- 자동 업데이트 트리거
- 프로젝트 시작 시 자동으로 수수료 생성하는 트리거

### 2. 코드 배포

변경된 파일들:
- `app/admin/page.tsx` - 관리자 대시보드 (시스템 설정 → 수수료 관리)
- `app/admin/commission/page.tsx` - 새로운 수수료 관리 페이지

## 📊 주요 기능

### 1. 자동 수수료 추적
- 고객이 프로젝트 시작 버튼을 누르면 (`in-progress` 상태로 변경)
- 자동으로 `commission_tracking` 테이블에 레코드가 생성됩니다
- 견적 금액의 10%가 수수료로 자동 계산됩니다

### 2. 수수료 정보
다음 정보가 자동으로 저장됩니다:
- ✅ 업체명
- ✅ 프로젝트 제목
- ✅ 견적 금액
- ✅ 수수료 비율 (기본 10%)
- ✅ 수수료 금액
- ✅ 프로젝트 시작 날짜
- ✅ 수수료 상태 (미수령/수령완료)

### 3. 관리자 기능

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

### 4. 대시보드 통계
관리자 대시보드에 새로운 통계 카드가 추가되었습니다:
- 미수령 수수료 총액 (CAD)
- 미수령 건수

## 🎯 사용 시나리오

### 시나리오 1: 정상 프로세스
1. 고객이 견적서를 받음
2. 고객이 "프로젝트 시작" 버튼 클릭
3. ✅ 자동으로 수수료 추적 생성
4. 관리자가 수수료 관리 페이지에서 확인
5. 업체로부터 수수료 수령
6. 관리자가 "수령완료" 버튼 클릭

### 시나리오 2: 수동 등록 (향후 추가 예정)
1. 고객이 버튼을 누르지 않음
2. 관리자가 수동으로 프로젝트 진행 사실 확인
3. 수수료 관리 페이지에서 "수동 등록" 기능 사용
4. 필요 정보 입력하여 수수료 추적 생성

## 📱 화면 구성

### 수수료 관리 페이지 (`/admin/commission`)

#### 상단 통계 카드
- 📊 미수령 수수료: 총액 및 건수
- ✅ 수령 완료: 총액 및 건수
- 💰 전체 수수료: 총액 및 건수

#### 필터 탭
- 전체 / 미수령 / 수령완료

#### 수수료 목록 테이블
| 업체명 | 프로젝트 | 견적금액 | 수수료 | 시작일 | 상태 | 메모 | 작업 |
|--------|----------|----------|--------|--------|------|------|------|
| ABC 건설 | 주방 리모델링 | $15,000 | $1,500 | 2025-01-15 | 미수령 | (메모) | [수령완료] |

## 🔧 데이터베이스 스키마

### commission_tracking 테이블

```sql
CREATE TABLE commission_tracking (
  id UUID PRIMARY KEY,
  quote_request_id UUID REFERENCES quote_requests(id),
  contractor_id UUID REFERENCES contractors(id),
  contractor_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  quote_amount DECIMAL(12, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  commission_amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'received'
  started_at TIMESTAMP WITH TIME ZONE,
  marked_manually BOOLEAN DEFAULT false,
  payment_received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 보안

- RLS (Row Level Security) 활성화
- 관리자 이메일(`cmgg919@gmail.com`)만 접근 가능
- 모든 작업에 대한 권한 검증

## 📈 향후 개선 사항

1. **수동 등록 기능**
   - 고객이 버튼을 누르지 않은 경우 수동으로 등록

2. **수수료 비율 조정**
   - 업체별 또는 프로젝트별 수수료 비율 설정

3. **엑셀 내보내기**
   - 회계 처리를 위한 데이터 내보내기

4. **알림 기능**
   - 새로운 수수료 발생 시 이메일 알림
   - 장기 미수령 수수료 경고

5. **통계 및 리포트**
   - 월별/분기별 수수료 통계
   - 업체별 수수료 분석

## ❓ 문제 해결

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

3. **수동으로 수수료 생성**
   ```sql
   INSERT INTO commission_tracking (
     quote_request_id, contractor_id, contractor_name,
     project_title, quote_amount, commission_amount,
     status, started_at, marked_manually
   ) VALUES (
     'quote_id', 'contractor_id', '업체명',
     '프로젝트명', 10000, 1000,
     'pending', NOW(), true
   );
   ```

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.

---

**마지막 업데이트**: 2025-11-06  
**버전**: 1.0.0
