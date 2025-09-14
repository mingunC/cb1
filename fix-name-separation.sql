-- 이름을 올바르게 분리하여 업데이트
-- Supabase SQL Editor에서 실행

-- Google 계정에서 가져온 이름을 올바르게 분리
UPDATE public.users 
SET 
  first_name = CASE 
    WHEN (SELECT raw_user_meta_data->>'given_name' FROM auth.users WHERE email = 'cmgg919@gmail.com') IS NOT NULL 
    THEN (SELECT raw_user_meta_data->>'given_name' FROM auth.users WHERE email = 'cmgg919@gmail.com')
    ELSE 'mingun'
  END,
  last_name = CASE 
    WHEN (SELECT raw_user_meta_data->>'family_name' FROM auth.users WHERE email = 'cmgg919@gmail.com') IS NOT NULL 
    THEN (SELECT raw_user_meta_data->>'family_name' FROM auth.users WHERE email = 'cmgg919@gmail.com')
    ELSE 'choi'
  END,
  updated_at = NOW()
WHERE email = 'cmgg919@gmail.com';

-- 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name,
  u.updated_at
FROM public.users u
WHERE u.email = 'cmgg919@gmail.com';
