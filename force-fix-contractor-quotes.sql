-- contractor_quotes 테이블 강제 수정
-- 테이블이 존재하지만 컬럼이 누락된 경우를 대비

-- 현재 테이블 상태 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;

-- 누락된 컬럼들 추가
ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS pdf_filename TEXT;

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

ALTER TABLE contractor_quotes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 컬럼이 NOT NULL인 경우 기본값 설정
ALTER TABLE contractor_quotes 
ALTER COLUMN price SET DEFAULT 0;

-- 기존 데이터가 있다면 기본값 업데이트
UPDATE contractor_quotes 
SET price = 0 
WHERE price IS NULL;

-- NOT NULL 제약조건 추가 (기본값이 설정된 후)
ALTER TABLE contractor_quotes 
ALTER COLUMN price SET NOT NULL;

-- 외래키 제약조건 확인 및 추가
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

  -- quote_requests 테이블 참조 (또는 quotes 테이블)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contractor_quotes_project_id_fkey'
  ) THEN
    -- quote_requests 테이블이 있으면 그것을 사용, 없으면 quotes 테이블 사용
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_requests') THEN
      ALTER TABLE contractor_quotes 
      ADD CONSTRAINT contractor_quotes_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES quote_requests(id) ON DELETE CASCADE;
    ELSE
      ALTER TABLE contractor_quotes 
      ADD CONSTRAINT contractor_quotes_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES quotes(id) ON DELETE CASCADE;
    END IF;
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

-- CHECK 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'contractor_quotes_status_check'
  ) THEN
    ALTER TABLE contractor_quotes 
    ADD CONSTRAINT contractor_quotes_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;
END $$;

-- 최종 테이블 구조 확인
SELECT 
  'contractor_quotes table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;

-- RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'contractor_quotes';
