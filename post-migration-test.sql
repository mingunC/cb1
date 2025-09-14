-- ================================================
-- 마이그레이션 후 테스트 스크립트
-- ================================================

-- 1. 새로운 데이터 삽입 테스트
INSERT INTO quote_requests (
    customer_id,
    space_type,
    project_types,
    budget,
    timeline,
    postal_code,
    full_address,
    visit_dates,
    description,
    status
) VALUES (
    gen_random_uuid(),
    'detached_house',
    ARRAY['kitchen', 'bathroom'],
    'under_50k',
    'immediate',
    'M5V 3A8',
    '123 Test Street',
    ARRAY['2024-01-15'],
    'Test description after migration',
    'pending'
);

-- 2. 잘못된 데이터 삽입 시도 (제약조건 테스트)
-- 이 쿼리들은 실패해야 합니다:

-- 잘못된 space_type
-- INSERT INTO quote_requests (customer_id, space_type, project_types, budget, timeline, postal_code, full_address, description) 
-- VALUES (gen_random_uuid(), 'invalid_type', ARRAY['kitchen'], 'under_50k', 'immediate', 'M5V 3A8', '123 Test', 'Test');

-- 잘못된 budget
-- INSERT INTO quote_requests (customer_id, space_type, project_types, budget, timeline, postal_code, full_address, description) 
-- VALUES (gen_random_uuid(), 'detached_house', ARRAY['kitchen'], 'invalid_budget', 'immediate', 'M5V 3A8', '123 Test', 'Test');

-- 잘못된 timeline
-- INSERT INTO quote_requests (customer_id, space_type, project_types, budget, timeline, postal_code, full_address, description) 
-- VALUES (gen_random_uuid(), 'detached_house', ARRAY['kitchen'], 'under_50k', 'invalid_timeline', 'M5V 3A8', '123 Test', 'Test');

-- 잘못된 project_types
-- INSERT INTO quote_requests (customer_id, space_type, project_types, budget, timeline, postal_code, full_address, description) 
-- VALUES (gen_random_uuid(), 'detached_house', ARRAY['invalid_project'], 'under_50k', 'immediate', 'M5V 3A8', '123 Test', 'Test');

-- 3. 최종 데이터 확인
SELECT 
    id,
    space_type,
    project_types,
    budget,
    timeline,
    postal_code,
    full_address,
    status,
    created_at
FROM quote_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. 제약조건 위반 확인 (모든 값이 올바른지)
SELECT 
    'Space Types Check' as check_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN space_type IN ('detached_house', 'town_house', 'condo', 'commercial') THEN 1 END) as valid_records
FROM quote_requests

UNION ALL

SELECT 
    'Budget Check' as check_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN budget IN ('under_50k', '50k_100k', 'over_100k') THEN 1 END) as valid_records
FROM quote_requests

UNION ALL

SELECT 
    'Timeline Check' as check_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN timeline IN ('immediate', '1_month', '3_months', 'planning') THEN 1 END) as valid_records
FROM quote_requests;

-- 5. 테스트 완료 메시지
SELECT '=== MIGRATION TEST COMPLETED ===' as status;
