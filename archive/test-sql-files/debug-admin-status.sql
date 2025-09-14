-- 관리자 권한 확인 및 디버깅
-- Supabase SQL Editor에서 실행

-- 1. cmgg919@gmail.com 사용자 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name
FROM users u
WHERE u.email = 'cmgg919@gmail.com';

-- 2. is_admin 함수 테스트
SELECT is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID);

-- 3. 모든 관리자 사용자 확인
SELECT 
  u.id,
  u.email,
  u.user_type
FROM users u
WHERE u.user_type = 'admin';
