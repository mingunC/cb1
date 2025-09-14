-- CHECK 제약조건을 snake_case로 수정
-- 1. 기존 제약조건 삭제
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_space_type_check;
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_budget_check;
ALTER TABLE quote_requests DROP CONSTRAINT IF EXISTS quote_requests_timeline_check;

-- 2. 기존 데이터를 snake_case로 업데이트 (제약조건 삭제 후)
UPDATE quote_requests SET 
    space_type = CASE 
        WHEN space_type = 'detached-house' THEN 'detached_house'
        WHEN space_type = 'town-house' THEN 'town_house'
        ELSE space_type
    END,
    budget = CASE 
        WHEN budget = 'under-50000' THEN 'under_50k'
        WHEN budget = '50000-100000' THEN '50k_100k'
        WHEN budget = 'over-100000' THEN 'over_100k'
        ELSE budget
    END,
    timeline = CASE 
        WHEN timeline = '1month' THEN '1_month'
        WHEN timeline = '3months' THEN '3_months'
        WHEN timeline = 'over-6months' THEN 'planning'
        ELSE timeline
    END;

-- 3. 새로운 snake_case 제약조건 추가 (데이터 업데이트 후)
ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_space_type_check 
CHECK (space_type IN ('detached_house', 'town_house', 'condo', 'commercial'));

ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_budget_check 
CHECK (budget IN ('under_50k', '50k_100k', 'over_100k'));

ALTER TABLE quote_requests ADD CONSTRAINT quote_requests_timeline_check 
CHECK (timeline IN ('immediate', '1_month', '3_months', 'planning'));
