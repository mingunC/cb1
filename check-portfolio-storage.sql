-- 포트폴리오 업로드 확인 및 스토리지 검증

-- 1. portfolios 테이블 확인
SELECT 
  'Step 1: portfolios 테이블 구조' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'portfolios'
ORDER BY ordinal_position;

-- 2. 업로드된 포트폴리오 확인
SELECT 
  'Step 2: 업로드된 포트폴리오' as step,
  p.id,
  p.contractor_id,
  p.title,
  p.description,
  p.image_url,
  p.category,
  p.year,
  p.created_at,
  c.company_name
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 3. 업체별 포트폴리오 개수
SELECT 
  'Step 3: 업체별 포트폴리오 개수' as step,
  c.company_name,
  c.id as contractor_id,
  COUNT(p.id) as portfolio_count
FROM contractors c
LEFT JOIN portfolios p ON p.contractor_id = c.id
GROUP BY c.id, c.company_name
ORDER BY portfolio_count DESC;

-- 4. storage.buckets 확인 (포트폴리오 이미지용 버킷)
SELECT 
  'Step 4: 스토리지 버킷 확인' as step,
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name IN ('portfolio-images', 'portfolios')
ORDER BY created_at DESC;

-- 5. storage.objects 확인 (업로드된 파일)
SELECT 
  'Step 5: 업로드된 파일' as step,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
WHERE bucket_id IN ('portfolio-images', 'portfolios')
ORDER BY created_at DESC
LIMIT 20;

-- 6. 이미지 URL이 있는 포트폴리오 확인
SELECT 
  'Step 6: 이미지 URL 검증' as step,
  p.id,
  p.title,
  p.image_url,
  c.company_name,
  CASE 
    WHEN p.image_url IS NULL THEN '❌ 이미지 URL 없음'
    WHEN p.image_url LIKE '%supabase%' THEN '✅ Supabase 스토리지 사용'
    WHEN p.image_url LIKE '%unsplash%' THEN '⚠️ 외부 이미지 (Unsplash)'
    ELSE '⚠️ 기타 외부 이미지'
  END as image_source
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC;

-- 7. 최근 생성된 포트폴리오 상세
SELECT 
  'Step 7: 최근 포트폴리오 상세' as step,
  p.*,
  c.company_name,
  c.contact_name
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. portfolios 테이블이 없는 경우 생성 스크립트
-- (이미 있으면 에러 나지만 무시 가능)
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT '주거공간',
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolios_contractor_id ON portfolios(contractor_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);

-- RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- RLS 정책
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
CREATE POLICY "Anyone can view portfolios" ON portfolios
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractors can manage own portfolios" ON portfolios;
CREATE POLICY "Contractors can manage own portfolios" ON portfolios
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- 스토리지 버킷 생성 (이미 있으면 에러 나지만 무시 가능)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 RLS 정책
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');

DROP POLICY IF EXISTS "Contractors can upload portfolio images" ON storage.objects;
CREATE POLICY "Contractors can upload portfolio images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Contractors can delete own portfolio images" ON storage.objects;
CREATE POLICY "Contractors can delete own portfolio images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

SELECT 'Portfolio setup complete!' as status;
