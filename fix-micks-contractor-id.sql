-- 1. 현재 micks1@me.com의 견적서 확인
SELECT 
    cq.id,
    cq.contractor_id,
    cq.project_id,
    cq.status,
    c.company_name,
    c.contact_name,
    u.email
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'micks1@me.com' OR cq.contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

-- 2. 올바른 contractor ID로 업데이트
UPDATE contractor_quotes 
SET contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

-- 3. site_visit_applications도 확인하고 수정
SELECT 
    sva.id,
    sva.contractor_id,
    sva.project_id,
    sva.status,
    c.company_name,
    u.email
FROM site_visit_applications sva
LEFT JOIN contractors c ON sva.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email = 'micks1@me.com' OR sva.contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

UPDATE site_visit_applications 
SET contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

-- 4. 수정 결과 확인
SELECT 
    'contractor_quotes' as table_name,
    cq.id,
    cq.contractor_id,
    cq.project_id,
    c.company_name,
    u.email
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.user_id = 'adecb6f4-45f5-445c-ab54-c2bc1b7cfead'

UNION ALL

SELECT 
    'site_visit_applications' as table_name,
    sva.id,
    sva.contractor_id,
    sva.project_id,
    c.company_name,
    u.email
FROM site_visit_applications sva
LEFT JOIN contractors c ON sva.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.user_id = 'adecb6f4-45f5-445c-ab54-c2bc1b7cfead';
