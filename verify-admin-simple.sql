-- 관리자 권한 확인을 위한 간단한 함수
-- Supabase SQL Editor에서 실행

-- cmgg919@gmail.com 사용자의 관리자 권한 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  CASE 
    WHEN u.user_type = 'admin' THEN true 
    ELSE false 
  END as is_admin
FROM users u
WHERE u.email = 'cmgg919@gmail.com';
