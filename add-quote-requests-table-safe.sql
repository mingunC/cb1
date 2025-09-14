-- 안전한 마이그레이션 스크립트 (대안)
-- add-quote-requests-table-safe.sql

-- 1. quote_requests 테이블만 생성 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- 2. 인덱스 추가 (이미 존재하면 스킵)
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 추가 (이미 존재하면 스킵)
DO $$
BEGIN
  -- 고객은 자신의 견적 요청서만 조회 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Customers can view their own quote requests') THEN
    CREATE POLICY "Customers can view their own quote requests" ON quote_requests
      FOR SELECT USING (auth.uid() = customer_id);
  END IF;

  -- 고객은 자신의 견적 요청서만 생성 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Customers can create their own quote requests') THEN
    CREATE POLICY "Customers can create their own quote requests" ON quote_requests
      FOR INSERT WITH CHECK (auth.uid() = customer_id);
  END IF;

  -- 고객은 자신의 견적 요청서만 수정 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Customers can update their own quote requests') THEN
    CREATE POLICY "Customers can update their own quote requests" ON quote_requests
      FOR UPDATE USING (auth.uid() = customer_id);
  END IF;

  -- 관리자는 모든 견적 요청서 조회 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Admins can view all quote requests') THEN
    CREATE POLICY "Admins can view all quote requests" ON quote_requests
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;

  -- 관리자는 모든 견적 요청서 수정 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Admins can update all quote requests') THEN
    CREATE POLICY "Admins can update all quote requests" ON quote_requests
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;

  -- 업체는 승인된 견적 요청서만 조회 가능
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Contractors can view approved quote requests') THEN
    CREATE POLICY "Contractors can view approved quote requests" ON quote_requests
      FOR SELECT USING (
        status IN ('approved', 'site-visit-pending', 'site-visit-completed', 'bidding') AND
        EXISTS (
          SELECT 1 FROM contractors 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5. 마이그레이션 (안전하게)
DO $$
DECLARE
  migration_count INTEGER := 0;
BEGIN
  -- quotes 테이블이 존재하고 quote_requests 테이블도 존재하는 경우에만 마이그레이션
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') 
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quote_requests') THEN
    
    -- 마이그레이션 실행
    INSERT INTO quote_requests (
      id, customer_id, space_type, project_types, 
      budget, timeline, postal_code, full_address, 
      description, status, created_at
    )
    SELECT 
      id, customer_id, space_type, 
      project_types,
      budget, timeline, postal_code, full_address,
      COALESCE(details->>'description', ''), status, created_at
    FROM quotes
    WHERE NOT EXISTS (
      SELECT 1 FROM quote_requests WHERE id = quotes.id
    );
    
    GET DIAGNOSTICS migration_count = ROW_COUNT;
    RAISE NOTICE 'Migration completed: % rows migrated from quotes to quote_requests', migration_count;
  ELSE
    RAISE NOTICE 'Skipping migration: quotes or quote_requests table does not exist';
  END IF;
END $$;

-- 6. 테이블 존재 여부 확인
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quote_requests') 
    THEN 'quote_requests table exists'
    ELSE 'quote_requests table does not exist'
  END as table_status;

-- 7. RLS 정책 확인
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quote_requests'
ORDER BY policyname;
