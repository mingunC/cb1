-- is_admin RPC 함수 테스트
-- Supabase SQL Editor에서 실행

-- 1. cmgg919@gmail.com 사용자 ID 확인
SELECT id, email, user_type 
FROM users 
WHERE email = 'cmgg919@gmail.com';

-- 2. is_admin 함수 직접 테스트 (위에서 나온 ID 사용)
SELECT is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID);

-- 3. 함수가 존재하는지 확인
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'is_admin';
