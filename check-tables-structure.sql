-- 현재 데이터베이스의 테이블 목록 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contractors', 'pros', 'quote_requests', 'quotes', 'temp_quotes')
ORDER BY table_name;

-- contractors 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- pros 테이블 구조 확인 (존재한다면)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pros' 
AND table_schema = 'public'
ORDER BY ordinal_position;
