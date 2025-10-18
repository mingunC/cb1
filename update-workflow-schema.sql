-- ========================================
-- 워크플로우 개선을 위한 스키마 업데이트
-- ========================================

-- 1. quote_requests 테이블에 선택된 업체 정보 컬럼 추가
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS selected_contractor_id UUID REFERENCES contractors(id),
ADD COLUMN IF NOT EXISTS selected_quote_id UUID REFERENCES contractor_quotes(id);

-- 2. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_quote_requests_selected_contractor 
ON quote_requests(selected_contractor_id) 
WHERE selected_contractor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_selected_quote 
ON quote_requests(selected_quote_id) 
WHERE selected_quote_id IS NOT NULL;

-- 3. bidding-closed 상태 추가 (기존 quote-submitted를 대체)
-- status 컬럼의 체크 제약조건 업데이트
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending',
  'approved',
  'site-visit-pending',
  'site-visit-completed',
  'bidding',
  'bidding-closed',
  'quote-submitted',  -- deprecated, but kept for backward compatibility
  'completed',
  'cancelled'
));

-- 4. 기존 quote-submitted 상태를 bidding-closed로 마이그레이션 (선택사항)
-- UPDATE quote_requests 
-- SET status = 'bidding-closed' 
-- WHERE status = 'quote-submitted';

-- 5. 상태 변경 로그 테이블 생성 (선택사항 - 추적용)
CREATE TABLE IF NOT EXISTS quote_request_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 6. 상태 변경 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_status_logs_quote_request 
ON quote_request_status_logs(quote_request_id, changed_at DESC);

-- 7. 상태 변경 트리거 함수 생성 (선택사항 - 자동 로깅)
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO quote_request_status_logs (
      quote_request_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status changed via trigger'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 트리거 생성 (선택사항)
DROP TRIGGER IF EXISTS quote_request_status_change_trigger ON quote_requests;
CREATE TRIGGER quote_request_status_change_trigger
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();

-- 9. 확인 쿼리
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_requests' 
  AND column_name IN ('selected_contractor_id', 'selected_quote_id', 'status')
ORDER BY ordinal_position;

-- 10. 현재 프로젝트 상태 분포 확인
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM quote_requests
GROUP BY status
ORDER BY count DESC;

COMMENT ON COLUMN quote_requests.selected_contractor_id IS '고객이 선택한 업체 ID (bidding-closed 이후)';
COMMENT ON COLUMN quote_requests.selected_quote_id IS '고객이 선택한 견적서 ID';
COMMENT ON TABLE quote_request_status_logs IS '프로젝트 상태 변경 내역 (감사 로그)';
