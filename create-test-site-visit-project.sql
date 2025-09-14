-- 테스트용 현장방문 프로젝트 생성
-- 1. 먼저 기존 데이터 확인
SELECT 
    id,
    space_type,
    project_types,
    budget,
    timeline,
    status,
    created_at
FROM quote_requests 
WHERE status IN ('pending', 'approved', 'site-visit-pending')
ORDER BY created_at DESC
LIMIT 5;

-- 2. pending 상태의 프로젝트를 site-visit-pending으로 변경 (테스트용)
-- 실제 프로젝트 ID를 확인한 후 아래 쿼리를 실행하세요
-- UPDATE quote_requests 
-- SET status = 'site-visit-pending', updated_at = now()
-- WHERE status = 'pending' 
-- LIMIT 1;

-- 3. 새로운 테스트 프로젝트 생성 (필요시)
INSERT INTO quote_requests (
    customer_id,
    space_type,
    project_types,
    budget,
    timeline,
    postal_code,
    full_address,
    description,
    photos,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'cmgg919@gmail.com' LIMIT 1),
    'detached_house',
    ARRAY['kitchen'],
    'under_50k',
    'immediate',
    'M5V 3A8',
    '123 Test Street',
    '현장방문 테스트 프로젝트',
    '[]',
    'site-visit-pending',
    now(),
    now()
) ON CONFLICT DO NOTHING;
