-- 마이그레이션 전 현재 상태 확인
-- ================================================

-- 1. 현재 quote_requests 테이블의 데이터 확인
SELECT 'Current Space Types:' as category, space_type, COUNT(*) 
FROM quote_requests 
WHERE space_type IS NOT NULL
GROUP BY space_type

UNION ALL

SELECT 'Current Budgets:' as category, budget, COUNT(*) 
FROM quote_requests 
WHERE budget IS NOT NULL
GROUP BY budget

UNION ALL

SELECT 'Current Timelines:' as category, timeline, COUNT(*) 
FROM quote_requests 
WHERE timeline IS NOT NULL
GROUP BY timeline

UNION ALL

SELECT 'Current Project Types:' as category, unnest(project_types) as project_type, COUNT(*) 
FROM quote_requests 
WHERE project_types IS NOT NULL AND array_length(project_types, 1) > 0
GROUP BY unnest(project_types)
ORDER BY category, 2;

-- 2. 현재 제약조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass
AND contype = 'c'
ORDER BY conname;

-- 3. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;
