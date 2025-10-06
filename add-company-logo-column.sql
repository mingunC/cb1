-- contractors 테이블에 company_logo 컬럼 추가

-- 1. 기존 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors' 
ORDER BY ordinal_position;

-- 2. company_logo 컬럼 추가
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 3. 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors' AND column_name = 'company_logo';

-- 4. 인덱스 추가 (선택사항, 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_contractors_company_logo 
ON contractors(company_logo) 
WHERE company_logo IS NOT NULL;

-- 완료 메시지
SELECT 'company_logo 컬럼이 성공적으로 추가되었습니다!' as message;
