-- users 테이블의 실제 컬럼 구조 확인
-- Supabase SQL Editor에서 실행

-- 모든 컬럼 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
