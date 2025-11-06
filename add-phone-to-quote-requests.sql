-- quote_requests 테이블에 phone 컬럼과 visit_date 컬럼 추가
-- 고객의 전화번호와 선호 방문 날짜를 저장하기 위함

-- phone 컬럼 추가 (전화번호)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- visit_date 컬럼 추가 (단일 선호 방문 날짜)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS visit_date TEXT;

-- 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
  AND column_name IN ('phone', 'visit_date')
ORDER BY column_name;

-- 결과 메시지
SELECT 'phone and visit_date columns added successfully' as status;
