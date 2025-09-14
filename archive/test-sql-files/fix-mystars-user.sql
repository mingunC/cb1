-- mystars100826@gmail.com 사용자를 users 테이블에 추가하는 스크립트

-- 1. 먼저 auth.users에서 해당 사용자 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'mystars100826@gmail.com';

-- 2. 해당 사용자가 users 테이블에 있는지 확인
SELECT id, email, user_type, first_name, last_name 
FROM public.users 
WHERE email = 'mystars100826@gmail.com';

-- 3. mystars100826@gmail.com이 users 테이블에 없다면 추가
-- (auth.users에서 ID를 가져와서 사용)
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
  COALESCE(au.raw_user_meta_data->>'first_name', '사용자'),
  COALESCE(au.raw_user_meta_data->>'last_name', '고객'),
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'mystars100826@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);

-- 4. quote_requests 테이블에서 해당 사용자의 견적요청 확인
SELECT 
  qr.id,
  qr.customer_id,
  qr.space_type,
  qr.project_types,
  qr.budget,
  qr.timeline,
  qr.status,
  qr.created_at,
  u.email as customer_email
FROM public.quote_requests qr
LEFT JOIN auth.users u ON qr.customer_id = u.id
WHERE u.email = 'mystars100826@gmail.com'
ORDER BY qr.created_at DESC;

-- 5. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'quote_requests')
ORDER BY tablename, policyname;
