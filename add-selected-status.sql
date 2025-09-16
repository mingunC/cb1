-- quote_requests 테이블에 'selected' 상태 추가
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'selected', 'completed', 'cancelled'));

-- contractor_quotes 테이블에 'selected' 상태 추가 (필요한 경우)
ALTER TABLE contractor_quotes 
DROP CONSTRAINT IF EXISTS contractor_quotes_status_check;

ALTER TABLE contractor_quotes 
ADD CONSTRAINT contractor_quotes_status_check 
CHECK (status IN ('submitted', 'accepted', 'rejected', 'selected'));
