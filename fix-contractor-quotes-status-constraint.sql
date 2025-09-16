-- contractor_quotes 테이블의 status 제약조건 수정
-- 코드에서 사용하는 'pending' 상태를 포함하도록 수정

-- 1. 현재 제약조건 삭제
ALTER TABLE contractor_quotes 
DROP CONSTRAINT IF EXISTS contractor_quotes_status_check;

-- 2. 새로운 제약조건 추가 (코드에서 실제 사용하는 값들 포함)
ALTER TABLE contractor_quotes 
ADD CONSTRAINT contractor_quotes_status_check 
CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'selected', 'expired'));

-- 3. 기본값 설정
ALTER TABLE contractor_quotes 
ALTER COLUMN status SET DEFAULT 'pending';

-- 4. 현재 데이터 확인
SELECT 
  'Current status values in contractor_quotes:' as info,
  status,
  COUNT(*) as count
FROM contractor_quotes 
GROUP BY status
ORDER BY status;

-- 5. 제약조건 확인
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'contractor_quotes_status_check';

-- 6. 성공 메시지
SELECT 'contractor_quotes status constraint updated successfully' as result;
