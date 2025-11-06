-- 수수료 관리 테이블 생성
CREATE TABLE IF NOT EXISTS commission_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  quote_amount DECIMAL(12, 2) NOT NULL, -- 견적 금액
  commission_rate DECIMAL(5, 2) DEFAULT 10.00, -- 수수료 비율 (기본 10%)
  commission_amount DECIMAL(12, 2) NOT NULL, -- 수수료 금액
  status TEXT NOT NULL DEFAULT 'pending', -- pending(미수령), received(수령완료)
  started_at TIMESTAMP WITH TIME ZONE, -- 고객이 프로젝트 시작 버튼을 누른 날짜
  marked_manually BOOLEAN DEFAULT false, -- 관리자가 수동으로 마킹했는지 여부
  payment_received_at TIMESTAMP WITH TIME ZONE, -- 수수료를 받은 날짜
  notes TEXT, -- 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT commission_tracking_status_check CHECK (status IN ('pending', 'received'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_commission_tracking_contractor ON commission_tracking(contractor_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_quote_request ON commission_tracking(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_status ON commission_tracking(status);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_started_at ON commission_tracking(started_at);

-- RLS 정책 설정
ALTER TABLE commission_tracking ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능하도록 설정
CREATE POLICY "관리자만 수수료 조회 가능" ON commission_tracking
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'cmgg919@gmail.com'
  );

CREATE POLICY "관리자만 수수료 추가 가능" ON commission_tracking
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'cmgg919@gmail.com'
  );

CREATE POLICY "관리자만 수수료 수정 가능" ON commission_tracking
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'cmgg919@gmail.com'
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_commission_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_tracking_updated_at
  BEFORE UPDATE ON commission_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_tracking_updated_at();

-- 프로젝트 상태가 'in-progress'로 변경될 때 자동으로 수수료 추적 생성하는 함수
CREATE OR REPLACE FUNCTION create_commission_on_project_start()
RETURNS TRIGGER AS $$
DECLARE
  v_contractor_name TEXT;
  v_quote_amount DECIMAL(12, 2);
  v_commission_amount DECIMAL(12, 2);
BEGIN
  -- status가 'in-progress'로 변경되었을 때만 실행
  IF NEW.status = 'in-progress' AND (OLD.status IS NULL OR OLD.status != 'in-progress') THEN
    -- 선택된 contractor_quote에서 정보 가져오기
    SELECT 
      c.company_name,
      cq.amount
    INTO 
      v_contractor_name,
      v_quote_amount
    FROM contractor_quotes cq
    JOIN contractors c ON cq.contractor_id = c.id
    WHERE cq.id = NEW.selected_contractor_quote_id;
    
    -- 견적 금액의 10%를 수수료로 계산
    v_commission_amount := v_quote_amount * 0.10;
    
    -- commission_tracking 테이블에 레코드 생성
    INSERT INTO commission_tracking (
      quote_request_id,
      contractor_id,
      contractor_name,
      project_title,
      quote_amount,
      commission_rate,
      commission_amount,
      status,
      started_at,
      marked_manually
    )
    SELECT 
      NEW.id,
      cq.contractor_id,
      v_contractor_name,
      NEW.title,
      v_quote_amount,
      10.00,
      v_commission_amount,
      'pending',
      NOW(),
      false
    FROM contractor_quotes cq
    WHERE cq.id = NEW.selected_contractor_quote_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_create_commission_on_project_start ON quote_requests;
CREATE TRIGGER trigger_create_commission_on_project_start
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_on_project_start();

-- 코멘트 추가
COMMENT ON TABLE commission_tracking IS '프로젝트 수수료 추적 테이블';
COMMENT ON COLUMN commission_tracking.quote_request_id IS '견적 요청 ID';
COMMENT ON COLUMN commission_tracking.contractor_id IS '업체 ID';
COMMENT ON COLUMN commission_tracking.contractor_name IS '업체명';
COMMENT ON COLUMN commission_tracking.project_title IS '프로젝트 제목';
COMMENT ON COLUMN commission_tracking.quote_amount IS '견적 금액';
COMMENT ON COLUMN commission_tracking.commission_rate IS '수수료 비율 (%)';
COMMENT ON COLUMN commission_tracking.commission_amount IS '수수료 금액';
COMMENT ON COLUMN commission_tracking.status IS '수수료 상태 (pending: 미수령, received: 수령완료)';
COMMENT ON COLUMN commission_tracking.started_at IS '프로젝트 시작일 (고객이 버튼을 누른 날짜)';
COMMENT ON COLUMN commission_tracking.marked_manually IS '관리자가 수동으로 마킹했는지 여부';
COMMENT ON COLUMN commission_tracking.payment_received_at IS '수수료 수령일';
COMMENT ON COLUMN commission_tracking.notes IS '관리자 메모';
