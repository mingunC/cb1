-- Google 계정에서 실제 이름으로 업데이트
-- Supabase SQL Editor에서 실행

-- Google OAuth에서 가져온 실제 이름으로 업데이트
UPDATE public.users 
SET 
  first_name = COALESCE(
    (au.raw_user_meta_data->>'given_name'),
    (au.raw_user_meta_data->>'name'),
    'Google'
  ),
  last_name = COALESCE(
    (au.raw_user_meta_data->>'family_name'),
    'User'
  ),
  updated_at = NOW()
FROM auth.users au
WHERE public.users.email = 'cmgg919@gmail.com'
AND au.email = 'cmgg919@gmail.com';

-- 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name,
  u.updated_at
FROM users u
WHERE u.email = 'cmgg919@gmail.com';
