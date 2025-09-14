-- 현재 quote_requests 테이블의 모든 상태 확인
SELECT 
    status,
    COUNT(*) as count
FROM quote_requests 
GROUP BY status
ORDER BY count DESC;

-- site-visit-pending 상태의 프로젝트 상세 확인
SELECT 
    id,
    space_type,
    project_types,
    budget,
    timeline,
    status,
    created_at,
    updated_at
FROM quote_requests 
WHERE status = 'site-visit-pending'
ORDER BY created_at DESC;