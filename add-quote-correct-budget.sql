-- mystars100826@gmail.com 사용자에게 올바른 budget 값으로 테스트 데이터 추가

-- 1. 테스트용 견적요청 데이터 추가 (올바른 budget 값 사용)
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
VALUES (
  gen_random_uuid(),
  '48497411-6ca1-49b9-bc98-c768c4e34ebb',
  'detached-house',
  ARRAY['kitchen', 'bathroom'],
  'under-50000',  -- 올바른 budget 값
  'within_3_months',
  '123 Test Street, Vancouver, BC',
  'V6B 1A1',
  '테스트용 견적요청입니다. 주방과 욕실 리노베이션을 원합니다.',
  'pending',
  NOW(),
  NOW()
);

-- 2. 추가 후 확인
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
