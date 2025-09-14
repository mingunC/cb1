-- 필요한 테이블들 생성
-- 1. quote_requests 테이블 생성
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  space_type TEXT NOT NULL CHECK (space_type IN ('detached_house', 'town_house', 'condo', 'commercial')),
  project_types TEXT[] NOT NULL,
  budget TEXT NOT NULL CHECK (budget IN ('under_50k', '50k_100k', 'over_100k')),
  timeline TEXT NOT NULL CHECK (timeline IN ('immediate', '1_month', '3_months', 'planning')),
  postal_code TEXT NOT NULL,
  full_address TEXT NOT NULL,
  visit_dates TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. contractors 테이블 생성 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  license_number TEXT,
  insurance_info TEXT,
  specialties JSONB DEFAULT '[]',
  years_experience INTEGER DEFAULT 0,
  portfolio_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);

-- 4. RLS 활성화
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (기본적인 정책들)
-- quote_requests 정책
DROP POLICY IF EXISTS "Users can view own quote requests" ON quote_requests;
CREATE POLICY "Users can view own quote requests" ON quote_requests
FOR ALL TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all quote requests" ON quote_requests;
CREATE POLICY "Admins can manage all quote requests" ON quote_requests
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'cmgg919@gmail.com'
  )
);

-- contractors 정책
DROP POLICY IF EXISTS "Contractors can view own data" ON contractors;
CREATE POLICY "Contractors can view own data" ON contractors
FOR ALL TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all contractors" ON contractors;
CREATE POLICY "Admins can manage all contractors" ON contractors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'cmgg919@gmail.com'
  )
);

-- 6. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quote_requests_updated_at ON quote_requests;
CREATE TRIGGER quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_requests_updated_at();

CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contractors_updated_at ON contractors;
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_contractors_updated_at();

-- 7. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO contractors (user_id, company_name, contact_name, phone, email, status) 
-- VALUES (gen_random_uuid(), '테스트 업체', '테스트 담당자', '123-456-7890', 'test@example.com', 'active')
-- ON CONFLICT DO NOTHING;

-- 최종 확인
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quote_requests', 'contractors')
ORDER BY table_name;
