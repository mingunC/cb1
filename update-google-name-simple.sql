-- Google 계정에서 실제 이름으로 업데이트 (간단한 방법)
-- Supabase SQL Editor에서 실행

-- 1. 먼저 Google 계정 정보 확인
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = 'cmgg919@gmail.com';

-- 2. Google 계정에서 실제 이름으로 업데이트
UPDATE public.users 
SET 
  first_name = CASE 
    WHEN (SELECT raw_user_meta_data->>'given_name' FROM auth.users WHERE email = 'cmgg919@gmail.com') IS NOT NULL 
    THEN (SELECT raw_user_meta_data->>'given_name' FROM auth.users WHERE email = 'cmgg919@gmail.com')
    WHEN (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE email = 'cmgg919@gmail.com') IS NOT NULL 
    THEN (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE email = 'cmgg919@gmail.com')
    ELSE 'Google'
  END,
  last_name = CASE 
    WHEN (SELECT raw_user_meta_data->>'family_name' FROM auth.users WHERE email = 'cmgg919@gmail.com') IS NOT NULL 
    THEN (SELECT raw_user_meta_data->>'family_name' FROM auth.users WHERE email = 'cmgg919@gmail.com')
    ELSE 'User'
  END,
  updated_at = NOW()
WHERE email = 'cmgg919@gmail.com';

-- 3. 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name,
  u.updated_at
FROM public.users u
WHERE u.email = 'cmgg919@gmail.com';
