-- mystars100826@gmail.com 사용자를 users 테이블에 추가 (간단 버전)

-- 1. 사용자 추가
INSERT INTO public.users (
  id, 
  email, 
  user_type, 
  first_name, 
  last_name,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'customer',
  'Ryan',
  'Choi',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'mystars100826@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);

-- 2. 추가 확인
SELECT 
  id, 
  email, 
  user_type, 
  first_name, 
  last_name
FROM public.users 
WHERE email = 'mystars100826@gmail.com';
