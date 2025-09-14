-- mystars100826@gmail.com 사용자를 users 테이블에 추가하고 견적요청 데이터 확인

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
  qr.created_at,
  qr.full_address,
  qr.description
FROM public.quote_requests qr
WHERE qr.customer_id = (
  SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'
)
ORDER BY qr.created_at DESC;

-- 5. quote_requests 테이블의 RLS 정책 확인
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
WHERE tablename = 'quote_requests'
ORDER BY policyname;

-- 6. 테스트용 견적요청 데이터가 없다면 추가 (선택사항)
-- INSERT INTO public.quote_requests (
--   id,
--   customer_id,
--   space_type,
--   project_types,
--   budget,
--   timeline,
--   full_address,
--   postal_code,
--   description,
--   status,
--   created_at,
--   updated_at
-- )
-- SELECT 
--   gen_random_uuid(),
--   au.id,
--   'detached-house',
--   ARRAY['kitchen', 'bathroom'],
--   '50k_to_100k',
--   'within_3_months',
--   '123 Test Street, Vancouver, BC',
--   'V6B 1A1',
--   '테스트용 견적요청입니다.',
--   'pending',
--   NOW(),
--   NOW()
-- FROM auth.users au
-- WHERE au.email = 'mystars100826@gmail.com'
-- AND NOT EXISTS (
--   SELECT 1 FROM public.quote_requests qr WHERE qr.customer_id = au.id
-- );
