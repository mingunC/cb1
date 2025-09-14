-- cmgg919@gmail.com 사용자를 관리자로 변경
-- Supabase SQL Editor에서 실행

-- 방법 1: 이미 users 테이블에 있다면 user_type만 변경
UPDATE users 
SET user_type = 'admin'
WHERE email = 'cmgg919@gmail.com';

-- 방법 2: users 테이블에 없다면 새로 생성 (관리자로)
INSERT INTO users (
  id, 
  email, 
  user_type,
  first_name,
  last_name,
  created_at, 
  updated_at
)
SELECT 
  id, 
  email, 
  'admin' as user_type,
  '관리자' as first_name,
  '계정' as last_name,
  created_at, 
  updated_at
FROM auth.users
WHERE email = 'cmgg919@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  updated_at = NOW();
