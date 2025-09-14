-- 현재 CHECK 제약조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass 
AND contype = 'c';
