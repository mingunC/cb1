-- quote_requests 테이블의 status 컬럼 제약조건 업데이트
-- 새로운 상태값들을 추가합니다

-- 기존 CHECK 제약조건 제거
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;

-- 새로운 CHECK 제약조건 추가 (기존 상태 + 새로운 상태)
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN (
  'pending', 
  'approved', 
  'in_progress', 
  'completed', 
  'cancelled',
  'site-visit-pending',
  'site-visit-completed', 
  'quote-submitted'
));

-- 기존 quotes 테이블도 동일하게 업데이트 (호환성을 위해)
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status IN (
  'pending', 
  'approved', 
  'in_progress', 
  'completed', 
  'cancelled',
  'site-visit-pending',
  'site-visit-completed', 
  'quote-submitted'
));
