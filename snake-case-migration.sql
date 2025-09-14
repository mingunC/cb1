-- ================================================
-- Snake Case 통일 마이그레이션 스크립트 (개선된 버전)
-- ================================================
-- 실행 전 백업을 권장합니다!

-- 0. 마이그레이션 전 현재 상태 확인
SELECT '=== MIGRATION PRE-CHECK ===' as status;

SELECT 'Current Space Types:' as category, space_type, COUNT(*) 
FROM quote_requests 
WHERE space_type IS NOT NULL
GROUP BY space_type
ORDER BY space_type;

-- 1. 기존 CHECK constraints 삭제 (안전하게)
DO $$ 
BEGIN
    -- Space type constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'quote_requests'::regclass 
        AND conname = 'quote_requests_space_type_check'
    ) THEN
        ALTER TABLE quote_requests DROP CONSTRAINT quote_requests_space_type_check;
        RAISE NOTICE 'Dropped quote_requests_space_type_check constraint';
    END IF;
    
    -- Budget constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'quote_requests'::regclass 
        AND conname = 'quote_requests_budget_check'
    ) THEN
        ALTER TABLE quote_requests DROP CONSTRAINT quote_requests_budget_check;
        RAISE NOTICE 'Dropped quote_requests_budget_check constraint';
    END IF;
    
    -- Timeline constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'quote_requests'::regclass 
        AND conname = 'quote_requests_timeline_check'
    ) THEN
        ALTER TABLE quote_requests DROP CONSTRAINT quote_requests_timeline_check;
        RAISE NOTICE 'Dropped quote_requests_timeline_check constraint';
    END IF;
    
    -- Project types constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'quote_requests'::regclass 
        AND conname = 'quote_requests_project_types_check'
    ) THEN
        ALTER TABLE quote_requests DROP CONSTRAINT quote_requests_project_types_check;
        RAISE NOTICE 'Dropped quote_requests_project_types_check constraint';
    END IF;
END $$;

-- 2. 데이터 마이그레이션 (kebab-case → snake_case)
-- Space type 마이그레이션
UPDATE quote_requests 
SET space_type = REPLACE(space_type, '-', '_')
WHERE space_type LIKE '%-%';

-- Budget 마이그레이션
UPDATE quote_requests 
SET budget = REPLACE(budget, '-', '_')
WHERE budget LIKE '%-%';

-- Timeline 마이그레이션
UPDATE quote_requests 
SET timeline = REPLACE(timeline, '-', '_')
WHERE timeline LIKE '%-%';

-- Project types 마이그레이션 (배열 내부 값들)
UPDATE quote_requests 
SET project_types = ARRAY(
    SELECT REPLACE(unnest(project_types), '-', '_')
)
WHERE EXISTS (
    SELECT 1 FROM unnest(project_types) AS pt 
    WHERE pt LIKE '%-%'
);

-- 3. 새로운 CHECK constraints 생성 (snake_case)
ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_space_type_check 
CHECK (space_type IN ('detached_house', 'town_house', 'condo', 'commercial'));

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_budget_check 
CHECK (budget IN ('under_50k', '50k_100k', 'over_100k'));

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_timeline_check 
CHECK (timeline IN ('immediate', '1_month', '3_months', 'planning'));

-- Project types constraint 함수 생성
CREATE OR REPLACE FUNCTION check_project_types(project_types text[])
RETURNS boolean AS $$
BEGIN
    -- 빈 배열 허용
    IF project_types IS NULL OR array_length(project_types, 1) IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- 모든 프로젝트 타입이 허용된 값인지 확인
    RETURN project_types <@ ARRAY[
        'kitchen', 
        'bathroom', 
        'basement', 
        'painting', 
        'flooring', 
        'full_renovation', 
        'other',
        'restaurant',
        'retail',
        'office',
        'education'
    ]::text[];
END;
$$ LANGUAGE plpgsql;

ALTER TABLE quote_requests
ADD CONSTRAINT quote_requests_project_types_check
CHECK (check_project_types(project_types));

-- 4. 컬럼에 대한 설명 추가 (문서화)
COMMENT ON COLUMN quote_requests.space_type IS 
'공간 유형 (snake_case): detached_house, town_house, condo, commercial';

COMMENT ON COLUMN quote_requests.budget IS 
'예산 범위 (snake_case): under_50k, 50k_100k, over_100k';

COMMENT ON COLUMN quote_requests.timeline IS 
'시작 시기 (snake_case): immediate, 1_month, 3_months, planning';

COMMENT ON COLUMN quote_requests.project_types IS 
'프로젝트 유형 배열 (snake_case): kitchen, bathroom, basement, painting, flooring, full_renovation, other 등';

-- 5. 마이그레이션 결과 확인
SELECT '=== MIGRATION POST-CHECK ===' as status;

SELECT 'Space Types:' as category, space_type, COUNT(*) 
FROM quote_requests 
WHERE space_type IS NOT NULL
GROUP BY space_type

UNION ALL

SELECT 'Budgets:' as category, budget, COUNT(*) 
FROM quote_requests 
WHERE budget IS NOT NULL
GROUP BY budget

UNION ALL

SELECT 'Timelines:' as category, timeline, COUNT(*) 
FROM quote_requests 
WHERE timeline IS NOT NULL
GROUP BY timeline

UNION ALL

SELECT 'Project Types:' as category, unnest(project_types) as project_type, COUNT(*) 
FROM quote_requests 
WHERE project_types IS NOT NULL AND array_length(project_types, 1) > 0
GROUP BY unnest(project_types)
ORDER BY category, 2;

-- 6. 새로운 CHECK constraints 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass
AND contype = 'c'
ORDER BY conname;

-- 7. 마이그레이션 완료 메시지
SELECT '=== MIGRATION COMPLETED SUCCESSFULLY ===' as status;
