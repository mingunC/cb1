-- 현장방문 참여 가능한 프로젝트 확인
-- 1. quote_requests 테이블의 상태별 프로젝트 확인
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
WHERE status IN ('site-visit-pending', 'bidding', 'pending')
ORDER BY created_at DESC;

-- 2. micks1@me.com 업체 정보 확인
SELECT 
    c.id as contractor_id,
    c.company_name,
    c.contact_name,
    c.status as contractor_status,
    u.email,
    u.id as user_id
FROM contractors c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'micks1@me.com';

-- 3. site_visit_applications 테이블 확인
SELECT 
    sva.id,
    sva.project_id,
    sva.contractor_id,
    sva.status as application_status,
    sva.applied_at,
    qr.status as project_status,
    c.company_name
FROM site_visit_applications sva
JOIN quote_requests qr ON sva.project_id = qr.id
JOIN contractors c ON sva.contractor_id = c.id
ORDER BY sva.applied_at DESC;
