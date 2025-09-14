-- contractor_quotes 테이블 생성
CREATE TABLE IF NOT EXISTS contractor_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  detailed_description TEXT,
  pdf_url TEXT,
  pdf_filename TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_project_id ON contractor_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_contractor_id ON contractor_quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_status ON contractor_quotes(status);

-- updated_at 트리거 추가
CREATE TRIGGER update_contractor_quotes_updated_at 
  BEFORE UPDATE ON contractor_quotes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Contractors can view their own quotes" ON contractor_quotes
  FOR SELECT USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert their own quotes" ON contractor_quotes
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own quotes" ON contractor_quotes
  FOR UPDATE USING (auth.uid() = contractor_id);

CREATE POLICY "Admins can view all contractor quotes" ON contractor_quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );