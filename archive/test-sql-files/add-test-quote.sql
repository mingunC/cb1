-- mystars100826@gmail.com 사용자에게 테스트용 견적요청 데이터 추가

-- 1. 사용자 ID 확인
SELECT 
  id, 
  email 
FROM auth.users 
WHERE email = 'mystars100826@gmail.com';

-- 2. 기존 견적요청 확인
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
LEFT JOIN auth.users au ON qr.customer_id = au.id
WHERE au.email = 'mystars100826@gmail.com'
ORDER BY qr.created_at DESC;

-- 3. 테스트용 견적요청 데이터 추가 (기존 데이터가 없는 경우에만)
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

-- 4. 추가 후 확인
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
