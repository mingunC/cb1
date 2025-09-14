-- quote_requests 테이블 확인 및 생성
-- 고객이 제출한 견적 요청을 저장하는 테이블

-- 기존 테이블 확인
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
ORDER BY ordinal_position;

-- quote_requests 테이블 생성 (temp_quotes와 유사하지만 승인된 것들만)
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
  description TEXT,
  photos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can manage all quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Contractors can view approved quote requests" ON quote_requests;

-- RLS 정책 생성
CREATE POLICY "Users can view own quote requests" ON quote_requests
FOR ALL TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage all quote requests" ON quote_requests
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Contractors can view approved quote requests" ON quote_requests
FOR SELECT TO authenticated
USING (
  status IN ('approved', 'site-visit-pending', 'site-visit-completed', 'bidding')
  AND EXISTS (
    SELECT 1 FROM contractors WHERE user_id = auth.uid()
  )
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_space_type ON quote_requests(space_type);
CREATE INDEX IF NOT EXISTS idx_quote_requests_budget ON quote_requests(budget);

-- updated_at 트리거
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

-- 최종 확인
SELECT 'quote_requests table created successfully' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
ORDER BY ordinal_position;
