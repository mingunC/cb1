-- quotes 테이블에 상태 추가
ALTER TABLE quote_requests 
ADD COLUMN status_detail VARCHAR(50) DEFAULT 'pending';

-- status_detail 값:
-- 'pending' - 초기 제출
-- 'approved' - 관리자 승인
-- 'site_visit_requested' - 현장방문 신청됨
-- 'site_visit_cancelled' - 현장방문 취소됨
-- 'site_visit_completed' - 현장방문 완료
-- 'quoted' - 견적 제출됨
-- 'contracted' - 계약 완료

-- site_visit_applications 테이블에 soft delete 추가
ALTER TABLE site_visit_applications
ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN cancelled_at TIMESTAMP,
ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

-- 기존 데이터에 status_detail 설정
UPDATE quote_requests 
SET status_detail = CASE 
  WHEN status = 'pending' THEN 'pending'
  WHEN status = 'approved' THEN 'approved'
  WHEN status = 'site-visit-pending' THEN 'approved'
  WHEN status = 'bidding' THEN 'approved'
  WHEN status = 'completed' THEN 'contracted'
  WHEN status = 'cancelled' THEN 'site_visit_cancelled'
  ELSE 'pending'
END;

-- site_visit_applications 테이블에 quote_id 컬럼 추가 (기존 project_id 대신)
ALTER TABLE site_visit_applications
ADD COLUMN quote_id UUID REFERENCES quote_requests(id);

-- 기존 project_id 데이터를 quote_id로 복사
UPDATE site_visit_applications 
SET quote_id = project_id 
WHERE project_id IS NOT NULL;

-- project_id 컬럼 제거 (선택사항)
-- ALTER TABLE site_visit_applications DROP COLUMN project_id;