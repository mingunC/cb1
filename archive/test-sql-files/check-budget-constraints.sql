-- quote_requests 테이블의 제약조건 확인
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quote_requests'::regclass;

-- budget 컬럼의 제약조건 상세 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
AND column_name = 'budget';