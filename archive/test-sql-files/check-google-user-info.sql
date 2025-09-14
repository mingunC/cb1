-- Google OAuth 사용자 정보 확인
-- Supabase SQL Editor에서 실행

-- 1. auth.users에서 Google 계정 정보 확인
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at
FROM auth.users
WHERE email = 'cmgg919@gmail.com';

-- 2. 현재 users 테이블 정보 확인
SELECT 
  id,
  email,
  user_type,
  first_name,
  last_name,
  created_at,
  updated_at
FROM users
WHERE email = 'cmgg919@gmail.com';
