-- 이벤트/프로모션 테이블 생성
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  
  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  description TEXT NOT NULL,
  
  -- 이벤트 타입
  type VARCHAR(50) NOT NULL CHECK (type IN ('discount', 'gift', 'special', 'season', 'collaboration')),
  
  -- 가격 정보
  discount_rate INTEGER CHECK (discount_rate >= 0 AND discount_rate <= 100),
  original_price BIGINT CHECK (original_price >= 0),
  discounted_price BIGINT CHECK (discounted_price >= 0),
  
  -- 이미지
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- 기간
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- 상태
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- 조건
  terms_conditions JSONB DEFAULT '[]'::jsonb,
  target_space JSONB DEFAULT '[]'::jsonb,
  min_budget BIGINT,
  
  -- 참여 제한
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  
  -- 태그
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약조건
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_price CHECK (
    (original_price IS NULL AND discounted_price IS NULL) OR
    (original_price IS NOT NULL AND discounted_price IS NOT NULL AND discounted_price <= original_price)
  ),
  CONSTRAINT valid_participants CHECK (
    (max_participants IS NULL AND current_participants = 0) OR
    (max_participants IS NOT NULL AND current_participants <= max_participants)
  )
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_contractor_id ON events(contractor_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- GIN 인덱스 (JSONB 필드용)
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_events_target_space ON events USING GIN (target_space);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 이벤트를 볼 수 있음
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (is_active = true);

-- 관리자와 해당 업체만 이벤트를 생성/수정/삭제할 수 있음
CREATE POLICY "Contractors can manage their own events"
  ON events FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- 코멘트 추가
COMMENT ON TABLE events IS '이벤트 및 프로모션 정보';
COMMENT ON COLUMN events.type IS '이벤트 타입: discount(할인), gift(증정), special(특별), season(시즌), collaboration(제휴)';
COMMENT ON COLUMN events.discount_rate IS '할인율 (%)';
COMMENT ON COLUMN events.terms_conditions IS '이용 조건 (JSON 배열)';
COMMENT ON COLUMN events.target_space IS '대상 공간 (JSON 배열)';
COMMENT ON COLUMN events.tags IS '태그 (JSON 배열)';
