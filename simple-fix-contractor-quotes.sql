-- contractor_quotes 테이블 간단 수정
-- 오류 없이 안전하게 실행되는 버전

-- 현재 테이블 상태 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;

-- 누락된 컬럼들 추가 (IF NOT EXISTS 사용)
ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS pdf_filename TEXT;

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- price 컬럼에 기본값 설정 (NULL인 경우)
UPDATE contractor_quotes 
SET price = 0 
WHERE price IS NULL;

-- price 컬럼을 NOT NULL로 설정
ALTER TABLE contractor_quotes 
ALTER COLUMN price SET NOT NULL;

-- 외래키 제약조건 추가 (존재하지 않는 경우만)
DO $$
BEGIN
  -- contractors 테이블 참조
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contractor_quotes_contractor_id_fkey'
  ) THEN
    ALTER TABLE contractor_quotes 
    ADD CONSTRAINT contractor_quotes_contractor_id_fkey 
    FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- UNIQUE 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contractor_quotes_contractor_id_project_id_key'
  ) THEN
    ALTER TABLE contractor_quotes 
    ADD CONSTRAINT contractor_quotes_contractor_id_project_id_key 
    UNIQUE (contractor_id, project_id);
  END IF;
END $$;

-- 최종 테이블 구조 확인
SELECT 
  'contractor_quotes table updated successfully' as status;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;
