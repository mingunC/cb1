-- approved 상태의 프로젝트를 site-visit-pending으로 변경
UPDATE quote_requests 
SET status = 'site-visit-pending', updated_at = now()
WHERE status = 'approved';

-- 변경 결과 확인
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
