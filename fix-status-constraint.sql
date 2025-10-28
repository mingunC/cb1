-- Fix quote_requests status constraint to include all required statuses

-- 1. Drop existing constraint
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

-- 2. Add comprehensive constraint with all statuses
ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending',夏天              -- 관리자 검토 대기
  'approved',             -- 관리자 승인
  'rejected',             -- 거절됨
  'site-visit-pending',   -- 현장방문 대기
  'site-visit-completed', -- 현장방문 완료
  'bidding',              -- 입찰 중
  'bidding-closed',       -- 입찰 종료 (참여자 없음 또는 관리자가 종료)
  'quote-submitted',      -- 견적서 제출됨
  'selected',             -- 선택됨
  'contractor-selected',  -- 업체 선정 완료
  'not-selected',         -- 미선정
  'in-progress',          -- 공사 진행 중
  'completed',            -- 공사 완료
  'cancelled'             -- 취소됨
));

-- 3. Update quotes table if it exists
ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN (
  'pending',
  'approved',
  'rejected',
  'site-visit-pending',
  'site-visit-completed',
  'bidding',
  'bidding-closed',
  'quote-submitted',
  'selected',
  'contractor-selected',
  'not-selected',
  'in-progress',
  'completed',
  'cancelled'
));

-- 4. Check current statuses in the database
SELECT 
  status,
  COUNT(*) as count
FROM quote_requests
GROUP BY status
ORDER BY count DESC;
