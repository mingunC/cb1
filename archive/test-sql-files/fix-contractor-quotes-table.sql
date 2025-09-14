-- contractor_quotes 테이블 존재 확인 및 재생성
-- 먼저 기존 테이블이 있는지 확인

-- 테이블 존재 확인
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;

-- 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS contractor_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  pdf_url TEXT,
  pdf_filename TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id, project_id)
);

-- RLS 활성화
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Contractors can manage their own quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Admins can manage all quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Customers can view quotes for their projects" ON contractor_quotes;

-- RLS 정책 재생성
CREATE POLICY "Contractors can manage their own quotes" ON contractor_quotes
FOR ALL TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all quotes" ON contractor_quotes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Customers can view quotes for their projects" ON contractor_quotes
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT id FROM quote_requests WHERE customer_id = auth.uid()
  )
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_contractor_id ON contractor_quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_project_id ON contractor_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_status ON contractor_quotes(status);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_contractor_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contractor_quotes_updated_at ON contractor_quotes;
CREATE TRIGGER contractor_quotes_updated_at
  BEFORE UPDATE ON contractor_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_quotes_updated_at();

-- 최종 확인
SELECT 'contractor_quotes table created successfully' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;
