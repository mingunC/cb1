-- quote_requests 테이블의 status 제약조건 업데이트
-- 프로젝트 시작 기능 추가를 위한 새로운 상태 추가

-- 1. 기존 제약조건 제거
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

-- 2. 새로운 상태를 포함한 제약조건 추가
ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending',              -- 관리자 검토 대기
  'approved',             -- 관리자 승인
  'site-visit-pending',   -- 현장방문 대기
  'site-visit-completed', -- 현장방문 완료
  'bidding',              -- 입찰 중
  'quote-submitted',      -- 견적서 제출됨
  'contractor-selected',  -- 업체 선정 완료 (NEW!)
  'in-progress',          -- 공사 진행 중 (NEW!)
  'completed',            -- 공사 완료
  'cancelled'             -- 취소됨
));

-- 3. project_started_at 필드 추가 (프로젝트 시작 시간 기록)
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS project_started_at TIMESTAMP WITH TIME ZONE;

-- 4. project_completed_at 필드 추가 (프로젝트 완료 시간 기록)
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS project_completed_at TIMESTAMP WITH TIME ZONE;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_quote_requests_project_started_at 
ON quote_requests(project_started_at);

CREATE INDEX IF NOT EXISTS idx_quote_requests_project_completed_at 
ON quote_requests(project_completed_at);

-- 6. 코멘트 추가
COMMENT ON COLUMN quote_requests.project_started_at IS '프로젝트 시작 시간 (고객이 "프로젝트 시작" 버튼을 누른 시점)';
COMMENT ON COLUMN quote_requests.project_completed_at IS '프로젝트 완료 시간';

-- 7. 확인 쿼리
SELECT 
  id,
  status,
  selected_contractor_id,
  project_started_at,
  project_completed_at,
  created_at,
  updated_at
FROM quote_requests
ORDER BY created_at DESC
LIMIT 5;

-- 8. 상태별 프로젝트 수 확인
SELECT 
  status,
  COUNT(*) as count
FROM quote_requests
GROUP BY status
ORDER BY count DESC;
