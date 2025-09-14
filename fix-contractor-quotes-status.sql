-- contractor_quotes 테이블의 status 제약조건 수정
-- 코드에서 사용하는 status 값과 일치하도록 수정

-- 현재 제약조건 확인
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%contractor_quotes%status%';

-- 기존 제약조건 삭제
ALTER TABLE contractor_quotes 
DROP CONSTRAINT IF EXISTS contractor_quotes_status_check;

-- 새로운 제약조건 추가 (코드에서 사용하는 값들)
ALTER TABLE contractor_quotes 
ADD CONSTRAINT contractor_quotes_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));

-- 기본값도 확인
ALTER TABLE contractor_quotes 
ALTER COLUMN status SET DEFAULT 'pending';

-- 기존 데이터의 status 값 확인 및 수정
SELECT DISTINCT status FROM contractor_quotes;

-- 잘못된 status 값이 있다면 수정
UPDATE contractor_quotes 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'accepted', 'rejected', 'expired');

-- 최종 확인
SELECT 
  'contractor_quotes status constraint updated successfully' as status;

SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'contractor_quotes_status_check';

-- 테이블 구조 최종 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
  AND column_name = 'status';
