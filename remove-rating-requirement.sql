-- ✅ reviews 테이블의 rating 컬럼을 nullable로 변경
-- 별점 제도를 제거하고 텍스트 리뷰만 사용

-- 1. rating 컬럼을 nullable로 변경
ALTER TABLE reviews 
ALTER COLUMN rating DROP NOT NULL;

-- 2. 기존의 rating 체크 제약조건 제거 (있는 경우)
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- 3. rating 컬럼의 기본값 제거 (있는 경우)
ALTER TABLE reviews 
ALTER COLUMN rating DROP DEFAULT;

-- 4. 확인 쿼리
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reviews' AND column_name = 'rating';

-- 5. 기존 리뷰 데이터 확인
SELECT 
  id,
  title,
  rating,
  created_at
FROM reviews
ORDER BY created_at DESC
LIMIT 5;
