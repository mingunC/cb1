-- quote_requests 테이블의 timeline CHECK 제약조건 확인

-- 1. timeline CHECK 제약조건 확인
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.quote_requests'::regclass 
AND conname LIKE '%timeline%';

-- 2. 기존 데이터에서 사용되는 timeline 값들 확인
SELECT DISTINCT timeline, COUNT(*) as count
FROM public.quote_requests 
GROUP BY timeline
ORDER BY timeline;

-- 3. 가능한 timeline 값들로 테스트 데이터 추가
-- 'asap' 시도
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
  'under-50000',
  'asap',  -- 가능한 timeline 값
  '123 Test Street, Vancouver, BC',
  'V6B 1A1',
  '테스트용 견적요청입니다. 주방과 욕실 리노베이션을 원합니다.',
  'pending',
  NOW(),
  NOW()
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
  qr.full_address,
  qr.description,
  au.email as customer_email
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
WHERE au.email = 'mystars100826@gmail.com'
ORDER BY qr.created_at DESC;
