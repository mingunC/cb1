-- 현재 프로젝트 상태 확인
SELECT 
    status,
    COUNT(*) as count
FROM quote_requests 
GROUP BY status
ORDER BY count DESC;

-- approved 상태의 프로젝트 상세 확인
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
WHERE status = 'approved'
ORDER BY created_at DESC;
