-- quote_requests 테이블의 상태값들 확인
SELECT status, COUNT(*) as count
FROM quote_requests 
GROUP BY status
ORDER BY count DESC;

-- 이번 달 생성된 견적 요청 수 (상태 무관)
SELECT COUNT(*) as total_this_month
FROM quote_requests 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- 이번 달 생성된 견적 요청 수 (상태별)
SELECT status, COUNT(*) as count
FROM quote_requests 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status
ORDER BY count DESC;