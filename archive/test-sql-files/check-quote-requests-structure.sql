-- quote_requests 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;
