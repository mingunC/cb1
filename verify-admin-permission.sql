-- 관리자 권한 확인
-- Supabase SQL Editor에서 실행

-- cmgg919@gmail.com 사용자의 관리자 권한 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  is_admin(u.id) as is_admin_check
FROM users u
WHERE u.email = 'cmgg919@gmail.com';

-- 또는 직접 RPC 함수 테스트
SELECT is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID);
