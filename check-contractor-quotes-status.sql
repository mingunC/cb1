-- 1. micks1@me.com과 관련된 모든 견적서 확인 (안전한 SELECT만)
SELECT 
    cq.id,
    cq.contractor_id,
    cq.project_id,
    cq.status,
    cq.price,
    cq.created_at,
    c.company_name,
    c.contact_name,
    u.email,
    qr.status as project_status
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN quote_requests qr ON cq.project_id = qr.id
WHERE cq.contractor_id IN ('58ead562-2045-4d14-8522-53728f72537e', '2707a61c-be13-4269-80d5-acece277a574')
   OR u.email = 'micks1@me.com'
ORDER BY cq.project_id, cq.created_at;

-- 2. 프로젝트별 중복 견적서 확인
SELECT 
    project_id,
    COUNT(*) as quote_count,
    array_agg(contractor_id) as contractor_ids,
    array_agg(id) as quote_ids
FROM contractor_quotes 
WHERE contractor_id IN ('58ead562-2045-4d14-8522-53728f72537e', '2707a61c-be13-4269-80d5-acece277a574')
GROUP BY project_id
HAVING COUNT(*) > 1;

-- 3. 현재 올바른 contractor_id로 되어 있는 견적서들
SELECT 
    cq.id,
    cq.project_id,
    cq.status,
    qr.status as project_status,
    c.company_name
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN quote_requests qr ON cq.project_id = qr.id
WHERE cq.contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
ORDER BY cq.created_at;
