-- quote_requests 테이블에 'in-progress' 상태 추가

-- 1. 기존 제약조건 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass 
AND contype = 'c';

-- 2. 기존 status 제약조건 삭제 (있는 경우)
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

-- 3. 새로운 status 제약조건 추가 (in-progress 포함)
ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending', 
  'approved', 
  'site-visit-pending', 
  'site-visit-completed', 
  'bidding', 
  'bidding-closed', 
  'quote-submitted',
  'in-progress',
  'completed', 
  'cancelled'
));

-- 4. 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'quote_requests' AND column_name = 'status';

-- 5. project_started_at 컬럼이 없는 경우 추가
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS project_started_at TIMESTAMPTZ;

-- 6. project_completed_at 컬럼이 없는 경우 추가
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS project_completed_at TIMESTAMPTZ;

-- 7. 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_requests' 
AND column_name IN ('project_started_at', 'project_completed_at');
