-- 프로젝트 상태 업데이트를 보장하는 트리거 생성
-- 이 트리거는 contractor_quotes 테이블에 accepted 상태가 생기면
-- 자동으로 quote_requests의 상태를 completed로 변경합니다

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_project_status_on_selection()
RETURNS TRIGGER AS $$
BEGIN
  -- contractor_quotes의 status가 'accepted'로 변경되었을 때
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- 해당 프로젝트의 상태를 'completed'로 업데이트
    UPDATE quote_requests
    SET 
      status = 'completed',
      selected_contractor_id = NEW.contractor_id,
      selected_quote_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.project_id
    AND status != 'completed'; -- 이미 완료된 경우는 제외
    
    -- 같은 프로젝트의 다른 견적들을 'rejected'로 변경
    UPDATE contractor_quotes
    SET 
      status = 'rejected',
      updated_at = NOW()
    WHERE project_id = NEW.project_id
    AND id != NEW.id
    AND status != 'rejected'; -- 이미 거절된 경우는 제외
    
    -- 로그 남기기 (선택사항)
    RAISE NOTICE 'Project % status updated to completed, quote % selected', NEW.project_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS trigger_update_project_on_selection ON contractor_quotes;

-- 3. 트리거 생성
CREATE TRIGGER trigger_update_project_on_selection
AFTER UPDATE OF status ON contractor_quotes
FOR EACH ROW
EXECUTE FUNCTION update_project_status_on_selection();

-- 4. quote_requests 테이블에 선택 관련 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
  -- selected_contractor_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' 
    AND column_name = 'selected_contractor_id'
  ) THEN
    ALTER TABLE quote_requests 
    ADD COLUMN selected_contractor_id UUID REFERENCES contractors(id);
  END IF;
  
  -- selected_quote_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' 
    AND column_name = 'selected_quote_id'
  ) THEN
    ALTER TABLE quote_requests 
    ADD COLUMN selected_quote_id UUID REFERENCES contractor_quotes(id);
  END IF;
END $$;

-- 5. 상태 체크 제약 조건 추가/업데이트
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE quote_requests 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'site_visit', 'bidding', 'completed', 'cancelled'));

-- 6. contractor_quotes 상태 체크 제약 조건
ALTER TABLE contractor_quotes 
DROP CONSTRAINT IF EXISTS check_quote_status;

ALTER TABLE contractor_quotes 
ADD CONSTRAINT check_quote_status 
CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'withdrawn'));

-- 7. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_status ON contractor_quotes(status);
CREATE INDEX IF NOT EXISTS idx_contractor_quotes_project_id ON contractor_quotes(project_id);

-- 8. 데이터 정합성 검증 함수
CREATE OR REPLACE FUNCTION validate_project_completion()
RETURNS TABLE (
  project_id UUID,
  project_status TEXT,
  accepted_quotes_count BIGINT,
  is_valid BOOLEAN,
  issue_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qr.id as project_id,
    qr.status as project_status,
    COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) as accepted_quotes_count,
    CASE 
      WHEN qr.status = 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) > 0 THEN TRUE
      WHEN qr.status != 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) = 0 THEN TRUE
      ELSE FALSE
    END as is_valid,
    CASE 
      WHEN qr.status = 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) = 0 THEN 
        'Project marked as completed but no accepted quote'
      WHEN qr.status != 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) > 0 THEN 
        'Project has accepted quote but not marked as completed'
      WHEN COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) > 1 THEN 
        'Multiple accepted quotes for same project'
      ELSE 'Valid'
    END as issue_description
  FROM quote_requests qr
  LEFT JOIN contractor_quotes cq ON qr.id = cq.project_id
  GROUP BY qr.id, qr.status
  HAVING 
    (qr.status = 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) = 0)
    OR (qr.status != 'completed' AND COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) > 0)
    OR COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) > 1;
END;
$$ LANGUAGE plpgsql;

-- 9. 데이터 정합성 수정 함수
CREATE OR REPLACE FUNCTION fix_project_status_consistency()
RETURNS TABLE (
  fixed_count INTEGER,
  details TEXT
) AS $$
DECLARE
  v_fixed_count INTEGER := 0;
BEGIN
  -- completed 상태인데 accepted quote가 없는 프로젝트 수정
  UPDATE quote_requests qr
  SET status = 'bidding'
  WHERE qr.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM contractor_quotes cq
    WHERE cq.project_id = qr.id
    AND cq.status = 'accepted'
  );
  
  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  
  -- accepted quote가 있는데 completed가 아닌 프로젝트 수정
  UPDATE quote_requests qr
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE qr.status != 'completed'
  AND EXISTS (
    SELECT 1 FROM contractor_quotes cq
    WHERE cq.project_id = qr.id
    AND cq.status = 'accepted'
  );
  
  GET DIAGNOSTICS v_fixed_count = v_fixed_count + ROW_COUNT;
  
  RETURN QUERY
  SELECT v_fixed_count, 'Fixed ' || v_fixed_count || ' inconsistent project statuses';
END;
$$ LANGUAGE plpgsql;

-- 10. 사용 예시 및 테스트
COMMENT ON FUNCTION validate_project_completion() IS 
'프로젝트 상태와 견적 승인 상태의 일관성을 검증합니다. 
사용법: SELECT * FROM validate_project_completion();';

COMMENT ON FUNCTION fix_project_status_consistency() IS 
'프로젝트 상태와 견적 승인 상태의 불일치를 자동으로 수정합니다. 
사용법: SELECT * FROM fix_project_status_consistency();';
