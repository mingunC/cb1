-- reviews 테이블에 업체 답글 관련 컬럼 추가

-- 1. contractor_reply 컬럼 추가 (답글 내용)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS contractor_reply TEXT;

-- 2. contractor_reply_date 컬럼 추가 (답글 작성 날짜)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS contractor_reply_date TIMESTAMP WITH TIME ZONE;

-- 3. 컬럼이 제대로 추가되었는지 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews' 
  AND column_name IN ('contractor_reply', 'contractor_reply_date')
ORDER BY column_name;

-- 4. reviews 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;
