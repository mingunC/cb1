-- 현재 데이터베이스의 주요 테이블들 확인
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'quote_requests', 
    'contractors', 
    'pros', 
    'quotes', 
    'temp_quotes',
    'users'
)
ORDER BY table_name;

-- quote_requests 테이블이 존재하는지 확인
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_requests' AND table_schema = 'public')
        THEN 'quote_requests 테이블 존재함'
        ELSE 'quote_requests 테이블 없음'
    END as quote_requests_status;

-- contractors 테이블이 존재하는지 확인  
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractors' AND table_schema = 'public')
        THEN 'contractors 테이블 존재함'
        ELSE 'contractors 테이블 없음'
    END as contractors_status;
