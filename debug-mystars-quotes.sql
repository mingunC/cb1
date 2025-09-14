-- mystars100826@gmail.com 사용자의 견적요청 데이터 확인

-- 1. auth.users에서 사용자 확인
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
WHERE email = 'mystars100826@gmail.com';

-- 2. public.users에서 사용자 확인
SELECT 
  id, 
  email, 
  user_type, 
  first_name, 
  last_name,
  created_at
FROM public.users 
WHERE email = 'mystars100826@gmail.com';

-- 3. quote_requests에서 해당 사용자의 견적요청 확인
SELECT 
  qr.id,
  qr.customer_id,
  qr.space_type,
  qr.project_types,
  qr.budget,
  qr.timeline,
  qr.status,
  qr.created_at,
  au.email as customer_email
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
WHERE au.email = 'mystars100826@gmail.com'
ORDER BY qr.created_at DESC;

-- 4. RLS 정책 확인
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

-- 5. quote_requests 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'quote_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;
