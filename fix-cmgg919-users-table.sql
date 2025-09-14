-- public.users 테이블에서 cmgg919@gmail.com 확인
-- Supabase SQL Editor에서 실행

-- 1. public.users 테이블에서 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
WHERE u.email = 'cmgg919@gmail.com';

-- 2. 만약 없다면 새로 생성
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
  NOW() as updated_at
FROM auth.users
WHERE email = 'cmgg919@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  first_name = '관리자',
  last_name = '계정',
  updated_at = NOW();

-- 3. 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name
FROM users u
WHERE u.email = 'cmgg919@gmail.com';
