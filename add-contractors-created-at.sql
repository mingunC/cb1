-- contractors 테이블에 created_at 컬럼 추가 및 마이그레이션

-- 1. contractors 테이블 확인
SELECT 
  id, 
  company_name, 
  created_at,
  email
FROM contractors
ORDER BY created_at DESC
LIMIT 5;

-- 2. created_at 컬럼이 없다면 추가
ALTER TABLE contractors 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. 기존 업체들의 created_at을 현재 시간으로 설정 (최초 1회만)
UPDATE contractors 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_contractors_created_at ON contractors(created_at);

-- 5. 최종 확인
SELECT 
  id, 
  company_name, 
  created_at,
  email,
  status
FROM contractors
ORDER BY created_at DESC
LIMIT 10;

-- 완료 메시지
SELECT 'contractors 테이블의 created_at 컬럼이 성공적으로 설정되었습니다!' as message;
