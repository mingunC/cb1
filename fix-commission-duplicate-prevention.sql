-- 중복 방지를 위한 수수료 추적 테이블 업데이트

-- 1. quote_request_id에 UNIQUE 제약조건 추가
ALTER TABLE commission_tracking 
ADD CONSTRAINT unique_quote_request_commission 
UNIQUE (quote_request_id);

-- 2. 트리거 함수를 중복 체크 로직 포함하도록 업데이트
CREATE OR REPLACE FUNCTION create_commission_on_project_start()
RETURNS TRIGGER AS $$
DECLARE
  v_contractor_name TEXT;
  v_quote_amount DECIMAL(12, 2);
  v_commission_amount DECIMAL(12, 2);
  v_existing_commission UUID;
BEGIN
  -- status가 'in-progress'로 변경되었을 때만 실행
  IF NEW.status = 'in-progress' AND (OLD.status IS NULL OR OLD.status != 'in-progress') THEN
    
    -- 이미 수수료 추적이 존재하는지 확인
    SELECT id INTO v_existing_commission
    FROM commission_tracking
    WHERE quote_request_id = NEW.id
    LIMIT 1;
    
    -- 이미 존재하면 중복 생성하지 않음
    IF v_existing_commission IS NOT NULL THEN
      RAISE NOTICE '수수료 추적이 이미 존재합니다: quote_request_id = %, commission_id = %', NEW.id, v_existing_commission;
      RETURN NEW;
    END IF;
    
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
    
    -- 견적 금액이 있을 때만 수수료 생성
    IF v_quote_amount IS NOT NULL THEN
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
      
      RAISE NOTICE '수수료 추적 생성 완료: quote_request_id = %, amount = %', NEW.id, v_commission_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_create_commission_on_project_start ON quote_requests;
CREATE TRIGGER trigger_create_commission_on_project_start
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_on_project_start();

-- 4. 이미 중복이 있다면 제거 (최초 생성된 것만 남김)
WITH duplicates AS (
  SELECT 
    id,
    quote_request_id,
    ROW_NUMBER() OVER (PARTITION BY quote_request_id ORDER BY created_at ASC) as rn
  FROM commission_tracking
)
DELETE FROM commission_tracking
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 확인용 쿼리
-- 중복 체크
SELECT 
  quote_request_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as commission_ids
FROM commission_tracking
GROUP BY quote_request_id
HAVING COUNT(*) > 1;

-- 결과가 없으면 중복이 없는 것입니다!
