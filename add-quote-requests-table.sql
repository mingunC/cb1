-- UUID 함수 확인 (Supabase는 gen_random_uuid() 사용)
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- users 테이블 참조
  space_type TEXT NOT NULL CHECK (space_type IN ('detached-house', 'condo', 'townhouse', 'commercial')),
  project_types TEXT[] NOT NULL,
  budget TEXT NOT NULL CHECK (budget IN ('under_50k', '50k_to_100k', 'over_100k')),
  timeline TEXT NOT NULL CHECK (timeline IN ('asap', 'within_1_month', 'within_3_months', 'flexible')),
  postal_code TEXT NOT NULL,
  full_address TEXT NOT NULL,
  visit_date TEXT,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- RLS 정책 추가
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 고객은 자신의 견적 요청서만 조회 가능
CREATE POLICY "Customers can view their own quote requests" ON quote_requests
  FOR SELECT USING (auth.uid() = customer_id);

-- 고객은 자신의 견적 요청서만 생성 가능
CREATE POLICY "Customers can create their own quote requests" ON quote_requests
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 고객은 자신의 견적 요청서만 수정 가능
CREATE POLICY "Customers can update their own quote requests" ON quote_requests
  FOR UPDATE USING (auth.uid() = customer_id);

-- 관리자는 모든 견적 요청서 조회 가능
CREATE POLICY "Admins can view all quote requests" ON quote_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자는 모든 견적 요청서 수정 가능
CREATE POLICY "Admins can update all quote requests" ON quote_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 업체는 승인된 견적 요청서만 조회 가능
CREATE POLICY "Contractors can view approved quote requests" ON quote_requests
  FOR SELECT USING (
    status IN ('approved', 'site-visit-pending', 'site-visit-completed', 'bidding') AND
    EXISTS (
      SELECT 1 FROM contractors 
      WHERE user_id = auth.uid()
    )
  );

-- 기존 quotes 데이터가 있다면 마이그레이션 (테이블 존재 확인 후)
DO $$
BEGIN
  -- quotes 테이블이 존재하는지 확인
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') THEN
    -- quote_requests 테이블이 존재하는지 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quote_requests') THEN
      -- 마이그레이션 실행
      INSERT INTO quote_requests (
        id, customer_id, space_type, project_types, 
        budget, timeline, postal_code, full_address, 
        description, status, created_at
      )
      SELECT 
        id, customer_id, space_type, 
        project_types, -- 이미 배열 형태
        budget, timeline, postal_code, full_address,
        COALESCE(details->>'description', ''), status, created_at
      FROM quotes
      WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE id = quotes.id
      );
      
      RAISE NOTICE 'Migration completed: % rows migrated from quotes to quote_requests', 
        (SELECT COUNT(*) FROM quote_requests WHERE id IN (SELECT id FROM quotes));
    ELSE
      RAISE NOTICE 'quote_requests table does not exist, skipping migration';
    END IF;
  ELSE
    RAISE NOTICE 'quotes table does not exist, skipping migration';
  END IF;
END $$;

-- 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'quote_requests'
);

-- RLS 정책 확인
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quote_requests';
