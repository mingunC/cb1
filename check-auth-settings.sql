-- Supabase Auth 설정 확인 및 수정 가이드

-- 1. 이메일 확인 비활성화 확인
-- Supabase Dashboard > Authentication > Settings > Email Auth에서 확인:
-- - "Enable email confirmations" 체크 해제
-- - "Enable email change confirmations" 체크 해제

-- 2. 현재 auth.users 테이블의 사용자들 확인
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'micks1@me.com';

-- 3. public.users 테이블의 사용자들 확인
SELECT 
  id,
  email,
  first_name,
  last_name,
  user_type,
  created_at
FROM public.users 
WHERE email = 'micks1@me.com';
