-- 방문 희망 날짜 데이터 확인
SELECT 
  id,
  visit_date,
  visit_dates,
  created_at
FROM quote_requests 
WHERE id = 'fd6e248c-3c47-4dd3-b5d2-e68b4e870b34';

-- 최근 생성된 견적 요청들의 방문 날짜 확인
SELECT 
  id,
  visit_date,
  visit_dates,
  created_at
FROM quote_requests 
ORDER BY created_at DESC 
LIMIT 5;

