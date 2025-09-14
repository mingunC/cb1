-- users 테이블의 user_type 컬럼 제약조건 확인
-- Supabase SQL Editor에서 실행

-- users 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- user_type 컬럼의 가능한 값들 확인 (CHECK 제약조건이 있다면)
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%user_type%';

-- 또는 더 간단하게 users 테이블의 모든 제약조건 확인
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
