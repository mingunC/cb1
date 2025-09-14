-- 포트폴리오 테이블 생성
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  duration TEXT NOT NULL,
  images TEXT[] DEFAULT '{}', -- 프로젝트 이미지 URLs
  before_images TEXT[] DEFAULT '{}', -- 사전 이미지 URLs
  after_images TEXT[] DEFAULT '{}', -- 사후 이미지 URLs
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolios_contractor_id ON portfolios(contractor_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);
CREATE INDEX IF NOT EXISTS idx_portfolios_project_type ON portfolios(project_type);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_featured ON portfolios(is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- RLS 정책 설정
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 업체는 자신의 포트폴리오만 조회/수정 가능
CREATE POLICY "Contractors can view their own portfolios" ON portfolios
  FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can insert their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their own portfolios" ON portfolios
  FOR UPDATE USING (contractor_id = auth.uid());

-- 공개 포트폴리오는 모든 사용자가 조회 가능 (승인된 것만)
CREATE POLICY "Public can view approved portfolios" ON portfolios
  FOR SELECT USING (status = 'approved');

-- 관리자는 모든 포트폴리오 조회/수정 가능
CREATE POLICY "Admins can view all portfolios" ON portfolios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all portfolios" ON portfolios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );
