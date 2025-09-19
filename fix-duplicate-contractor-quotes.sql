-- 1. 먼저 중복된 견적서 확인
SELECT 
    cq.id,
    cq.contractor_id,
    cq.project_id,
    cq.status,
    cq.price,
    cq.created_at,
    c.company_name,
    c.contact_name,
    u.email
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE cq.project_id = '754a95f9-6fe2-45bf-bc0f-d97545ab0455'
ORDER BY cq.created_at;

-- 2. 잘못된 contractor_id로 된 견적서 삭제 (중복 해결)
DELETE FROM contractor_quotes 
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e'
  AND project_id = '754a95f9-6fe2-45bf-bc0f-d97545ab0455';

-- 3. 삭제 후 남은 견적서 확인
SELECT 
    cq.id,
    cq.contractor_id,
    cq.project_id,
    cq.status,
    cq.price,
    cq.created_at,
    c.company_name,
    u.email
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE cq.project_id = '754a95f9-6fe2-45bf-bc0f-d97545ab0455'
ORDER BY cq.created_at;

-- 4. 다른 프로젝트들도 확인하고 수정
SELECT 
    cq.id,
    cq.contractor_id,
    cq.project_id,
    cq.status,
    c.company_name,
    u.email,
    -- 올바른 contractor_id가 같은 프로젝트에 있는지 확인
    (SELECT COUNT(*) 
     FROM contractor_quotes cq2 
     WHERE cq2.project_id = cq.project_id 
       AND cq2.contractor_id = '2707a61c-be13-4269-80d5-acece277a574') as correct_id_exists
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE cq.contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

-- 5. 중복이 없는 프로젝트들만 업데이트
UPDATE contractor_quotes 
SET contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e'
  AND project_id NOT IN (
    SELECT project_id 
    FROM contractor_quotes 
    WHERE contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
  );

-- 6. 중복이 있는 프로젝트의 잘못된 견적서는 삭제
DELETE FROM contractor_quotes 
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e'
  AND project_id IN (
    SELECT project_id 
    FROM contractor_quotes 
    WHERE contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
  );

-- 7. site_visit_applications도 동일하게 처리
-- 먼저 중복 확인
SELECT 
    sva.id,
    sva.contractor_id,
    sva.project_id,
    sva.status,
    sva.created_at,
    c.company_name,
    u.email,
    (SELECT COUNT(*) 
     FROM site_visit_applications sva2 
     WHERE sva2.project_id = sva.project_id 
       AND sva2.contractor_id = '2707a61c-be13-4269-80d5-acece277a574') as correct_id_exists
FROM site_visit_applications sva
LEFT JOIN contractors c ON sva.contractor_id = c.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE sva.contractor_id = '58ead562-2045-4d14-8522-53728f72537e';

-- 8. site_visit_applications 업데이트 (중복 없는 것만)
UPDATE site_visit_applications 
SET contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e'
  AND project_id NOT IN (
    SELECT project_id 
    FROM site_visit_applications 
    WHERE contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
  );

-- 9. site_visit_applications 중복 삭제
DELETE FROM site_visit_applications 
WHERE contractor_id = '58ead562-2045-4d14-8522-53728f72537e'
  AND project_id IN (
    SELECT project_id 
    FROM site_visit_applications 
    WHERE contractor_id = '2707a61c-be13-4269-80d5-acece277a574'
  );

-- 10. 최종 확인
SELECT 
    'contractor_quotes' as table_name,
    COUNT(*) as count,
    array_agg(DISTINCT project_id) as project_ids
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE c.user_id = 'adecb6f4-45f5-445c-ab54-c2bc1b7cfead'

UNION ALL

SELECT 
    'site_visit_applications' as table_name,
    COUNT(*) as count,
    array_agg(DISTINCT project_id) as project_ids
FROM site_visit_applications sva
LEFT JOIN contractors c ON sva.contractor_id = c.id
WHERE c.user_id = 'adecb6f4-45f5-445c-ab54-c2bc1b7cfead';
