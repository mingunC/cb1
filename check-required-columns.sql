-- users 테이블의 모든 필수 컬럼 확인
-- Supabase SQL Editor에서 실행

-- NOT NULL 제약조건이 있는 컬럼들 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND is_nullable = 'NO'  -- NOT NULL 컬럼만
ORDER BY ordinal_position;
