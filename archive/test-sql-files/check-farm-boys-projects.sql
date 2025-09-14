-- Farm Boys 업체의 프로젝트 현황 확인

-- 1. Farm Boys 업체 정보 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    c.created_at
FROM contractors c
WHERE c.company_name ILIKE '%Farm Boys%' 
   OR c.company_name ILIKE '%farm%'
   OR c.company_name ILIKE '%Farm%';

-- 2. Farm Boys 업체의 견적서 제출 현황 확인
SELECT 
    cq.id,
    cq.project_id,
    cq.contractor_id,
    cq.price,
    cq.description,
    cq.status,
    cq.created_at,
    c.company_name
FROM contractor_quotes cq
JOIN contractors c ON cq.contractor_id = c.id
WHERE c.company_name ILIKE '%Farm Boys%' 
   OR c.company_name ILIKE '%farm%'
   OR c.company_name ILIKE '%Farm%';

-- 3. 모든 견적 요청 프로젝트 상태 확인
SELECT 
    qr.id,
    qr.customer_id,
    qr.space_type,
    qr.project_types,
    qr.budget,
    qr.timeline,
    qr.status,
    qr.created_at,
    qr.updated_at
FROM quote_requests qr
ORDER BY qr.created_at DESC
LIMIT 10;

-- 4. 각 프로젝트별 업체 견적서 제출 현황
SELECT 
    qr.id as project_id,
    qr.status as project_status,
    qr.space_type,
    qr.project_types,
    COUNT(cq.id) as quote_count,
    STRING_AGG(c.company_name, ', ') as contractors_submitted
FROM quote_requests qr
LEFT JOIN contractor_quotes cq ON qr.id = cq.project_id
LEFT JOIN contractors c ON cq.contractor_id = c.id
GROUP BY qr.id, qr.status, qr.space_type, qr.project_types
ORDER BY qr.created_at DESC;

-- 5. Farm Boys가 견적서를 제출한 프로젝트의 상태 확인
SELECT 
    qr.id as project_id,
    qr.status as project_status,
    qr.space_type,
    qr.project_types,
    qr.budget,
    qr.timeline,
    qr.created_at as project_created,
    cq.price,
    cq.description,
    cq.status as quote_status,
    cq.created_at as quote_created,
    c.company_name
FROM quote_requests qr
JOIN contractor_quotes cq ON qr.id = cq.project_id
JOIN contractors c ON cq.contractor_id = c.id
WHERE c.company_name ILIKE '%Farm Boys%' 
   OR c.company_name ILIKE '%farm%'
   OR c.company_name ILIKE '%Farm%'
ORDER BY qr.created_at DESC;

-- 6. 프로젝트 상태별 개수 확인
SELECT 
    status,
    COUNT(*) as count
FROM quote_requests
GROUP BY status
ORDER BY count DESC;
