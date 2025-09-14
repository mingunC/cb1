-- mystars100826@gmail.com 사용자 추가 및 이름 설정

-- 1. auth.users에서 사용자 정보 확인
SELECT 
  id, 
  email, 
  raw_user_meta_data,
  created_at 
FROM auth.users 
WHERE email = 'mystars100826@gmail.com';

-- 2. users 테이블에 사용자 추가 (실제 이름으로)
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
  'Ryan',  -- 실제 이름으로 변경
  'Choi',  -- 실제 이름으로 변경
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'mystars100826@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);

-- 3. 추가된 사용자 확인
SELECT 
  id, 
  email, 
  user_type, 
  first_name, 
  last_name,
  created_at
FROM public.users 
WHERE email = 'mystars100826@gmail.com';

-- 4. 견적요청 데이터 확인
SELECT 
  qr.id,
  qr.customer_id,
  qr.space_type,
  qr.project_types,
  qr.budget,
  qr.timeline,
  qr.status,
  qr.created_at
FROM public.quote_requests qr
WHERE qr.customer_id = (
  SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'
)
ORDER BY qr.created_at DESC;
