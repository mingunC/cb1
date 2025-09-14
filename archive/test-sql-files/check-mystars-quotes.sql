-- mystars100826@gmail.com 사용자의 견적요청 데이터 확인

-- 1. 사용자 ID 확인
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
WHERE email = 'mystars100826@gmail.com';

-- 2. users 테이블에서 사용자 정보 확인
SELECT 
  id, 
  email, 
  user_type, 
  first_name, 
  last_name,
  created_at
FROM public.users 
WHERE email = 'mystars100826@gmail.com';

-- 3. quote_requests 테이블에서 해당 사용자의 견적요청 확인
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
  qr.description,
  au.email as customer_email
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
WHERE au.email = 'mystars100826@gmail.com'
ORDER BY qr.created_at DESC;

-- 4. quote_requests 테이블의 모든 데이터 확인 (테스트용)
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
ORDER BY qr.created_at DESC
LIMIT 10;

-- 5. 테스트용 견적요청 데이터 추가 (데이터가 없는 경우)
INSERT INTO public.quote_requests (
  id,
  customer_id,
  space_type,
  project_types,
  budget,
  timeline,
  full_address,
  postal_code,
  description,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  au.id,
  'detached-house',
  ARRAY['kitchen', 'bathroom'],
  '50k_to_100k',
  'within_3_months',
  '123 Test Street, Vancouver, BC',
  'V6B 1A1',
  '테스트용 견적요청입니다. 주방과 욕실 리노베이션을 원합니다.',
  'pending',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'mystars100826@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.quote_requests qr WHERE qr.customer_id = au.id
);
