-- is_admin 함수 실제 테스트
-- Supabase SQL Editor에서 실행

-- 1. cmgg919@gmail.com 사용자 정보 확인
SELECT id, email, user_type 
FROM users 
WHERE email = 'cmgg919@gmail.com';

-- 2. 해당 사용자 ID로 is_admin 함수 테스트
SELECT is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID) as is_admin_result;

-- 3. 다른 방법으로도 테스트
SELECT 
  u.id,
  u.email,
  u.user_type,
  CASE 
    WHEN u.user_type = 'admin' THEN true 
    ELSE false 
  END as should_be_admin
FROM users u
WHERE u.email = 'cmgg919@gmail.com';
