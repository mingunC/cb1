-- Farm Boys 업체 대시보드 문제 진단

-- 1. Farm Boys 업체 정보 확인
SELECT 
    c.id as contractor_id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status as contractor_status
FROM contractors c
WHERE c.company_name ILIKE '%Farm Boys%' 
   OR c.company_name ILIKE '%farm%'
   OR c.company_name ILIKE '%Farm%';

-- 2. 현재 모든 프로젝트 상태 확인
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM quote_requests
GROUP BY status
ORDER BY count DESC;

-- 3. 'bidding' 상태인 프로젝트들 확인 (업체 대시보드에서 보이는 프로젝트들)
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
WHERE qr.status = 'bidding'
ORDER BY qr.created_at DESC;

-- 4. Farm Boys가 이미 견적서를 제출한 프로젝트들 확인
SELECT 
    cq.id as quote_id,
    cq.project_id,
    cq.price,
    cq.description,
    cq.status as quote_status,
    cq.created_at as quote_created,
    qr.status as project_status,
    qr.space_type,
    qr.project_types,
    c.company_name
FROM contractor_quotes cq
JOIN contractors c ON cq.contractor_id = c.id
JOIN quote_requests qr ON cq.project_id = qr.id
WHERE c.company_name ILIKE '%Farm Boys%' 
   OR c.company_name ILIKE '%farm%'
   OR c.company_name ILIKE '%Farm%'
ORDER BY cq.created_at DESC;

-- 5. Farm Boys가 입찰 가능한 프로젝트들 (bidding 상태이면서 아직 견적서를 제출하지 않은 프로젝트들)
WITH farm_boys_contractor AS (
    SELECT id FROM contractors 
    WHERE company_name ILIKE '%Farm Boys%' 
       OR company_name ILIKE '%farm%'
       OR company_name ILIKE '%Farm%'
),
submitted_projects AS (
    SELECT DISTINCT project_id 
    FROM contractor_quotes cq
    JOIN farm_boys_contractor fbc ON cq.contractor_id = fbc.id
)
SELECT 
    qr.id,
    qr.customer_id,
    qr.space_type,
    qr.project_types,
    qr.budget,
    qr.timeline,
    qr.status,
    qr.created_at
FROM quote_requests qr
WHERE qr.status = 'bidding'
AND qr.id NOT IN (SELECT project_id FROM submitted_projects)
ORDER BY qr.created_at DESC;

-- 6. 프로젝트 상태를 'bidding'으로 변경하는 쿼리 (필요시 사용)
-- UPDATE quote_requests 
-- SET status = 'bidding', updated_at = NOW()
-- WHERE status IN ('pending', 'approved', 'site-visit-pending', 'site-visit-completed')
-- AND id IN (SELECT id FROM quote_requests ORDER BY created_at DESC LIMIT 5);
