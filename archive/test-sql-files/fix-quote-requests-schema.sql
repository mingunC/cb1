-- quote_requests 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
ORDER BY ordinal_position;

-- 테이블이 존재하지 않으면 생성
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

-- visit_dates 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quote_requests' AND column_name = 'visit_dates'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN visit_dates TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 최종 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
ORDER BY ordinal_position;
