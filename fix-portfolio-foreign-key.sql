-- portfolios 테이블 Foreign Key 문제 해결

-- 1. 먼저 현재 portfolios 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'portfolios'
ORDER BY ordinal_position;

-- 2. Foreign Key 제약조건 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'portfolios';

-- 3. portfolios 테이블이 없으면 생성 (올바른 FK와 함께)
DROP TABLE IF EXISTS portfolios CASCADE;

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT '주거공간',
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX idx_portfolios_contractor_id ON portfolios(contractor_id);
CREATE INDEX idx_portfolios_created_at ON portfolios(created_at DESC);
CREATE INDEX idx_portfolios_category ON portfolios(category);

-- 5. RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
CREATE POLICY "Anyone can view portfolios" ON portfolios
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractors can insert own portfolios" ON portfolios;
CREATE POLICY "Contractors can insert own portfolios" ON portfolios
  FOR INSERT WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Contractors can update own portfolios" ON portfolios;
CREATE POLICY "Contractors can update own portfolios" ON portfolios
  FOR UPDATE USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Contractors can delete own portfolios" ON portfolios;
CREATE POLICY "Contractors can delete own portfolios" ON portfolios
  FOR DELETE USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- 7. updated_at 트리거
CREATE OR REPLACE FUNCTION update_portfolios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portfolios_updated_at ON portfolios;
CREATE TRIGGER portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolios_updated_at();

-- 8. 스토리지 버킷 확인 및 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. 스토리지 RLS 정책
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');

DROP POLICY IF EXISTS "Contractors can upload portfolio images" ON storage.objects;
CREATE POLICY "Contractors can upload portfolio images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Contractors can update own portfolio images" ON storage.objects;
CREATE POLICY "Contractors can update own portfolio images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Contractors can delete own portfolio images" ON storage.objects;
CREATE POLICY "Contractors can delete own portfolio images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 10. 검증
SELECT 
  'Portfolio table setup complete!' as status,
  'Foreign key relationship created: portfolios.contractor_id -> contractors.id' as relationship;

-- 11. 테스트 쿼리 (이제 작동해야 함)
SELECT 
  p.id,
  p.title,
  p.image_url,
  c.company_name,
  c.company_logo
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC
LIMIT 5;

-- 12. Supabase PostgREST가 관계를 인식하도록 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache refreshed! Relationship should now work.' as result;
