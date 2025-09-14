-- 현재 contractors 테이블 데이터 확인 및 테스트 업체 추가

-- 1. 현재 데이터 확인
SELECT 
  id,
  company_name,
  contact_name,
  email,
  phone,
  address,
  specialties,
  years_experience,
  status,
  rating
FROM public.contractors
ORDER BY created_at DESC;

-- 2. 테스트 업체 데이터 추가 (기존 데이터와 충돌하지 않도록)
INSERT INTO public.contractors (
  id,
  user_id,
  company_name,
  contact_name,
  email,
  phone,
  address,
  license_number,
  insurance_info,
  specialties,
  years_experience,
  portfolio_count,
  rating,
  status
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '김리노베이션',
  '김대표',
  'kim@renovation.com',
  '010-1234-5678',
  '서울 강남구',
  'LIC-001',
  '15년간 주방과 욕실 리노베이션에 특화된 전문 업체입니다. 완전보험 가입.',
  '["주방", "욕실", "전체"]'::jsonb,
  15,
  25,
  4.8,
  'verified'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '퍼펙트홈',
  '박대표',
  'park@perfecthome.com',
  '010-2345-6789',
  '서울 송파구',
  'LIC-002',
  '욕실과 지하실 리노베이션 전문 업체입니다. 현대적이고 실용적인 디자인으로 공간을 새롭게 만들어드립니다.',
  '["욕실", "지하실", "발코니"]'::jsonb,
  12,
  18,
  4.7,
  'verified'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '스마트리노',
  '이대표',
  'lee@smartreno.com',
  '010-3456-7890',
  '서울 마포구',
  'LIC-003',
  '18년 경력의 리노베이션 전문 업체입니다. 스마트한 디자인과 친환경 재료를 사용하여 건강한 공간을 만들어드립니다.',
  '["주방", "전체", "인테리어"]'::jsonb,
  18,
  32,
  4.9,
  'verified'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '최고리노베이션',
  '최대표',
  'choi@bestreno.com',
  '010-4567-8901',
  '서울 서초구',
  'LIC-004',
  '고급 주거공간 리노베이션 전문 업체입니다. 프리미엄 재료와 정교한 시공으로 최고의 품질을 제공합니다.',
  '["전체", "주방", "욕실", "거실"]'::jsonb,
  20,
  45,
  4.9,
  'verified'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '정원인테리어',
  '정대표',
  'jung@garden.com',
  '010-5678-9012',
  '서울 영등포구',
  'LIC-005',
  '정원과 발코니 인테리어 전문 업체입니다. 자연친화적인 디자인으로 아름다운 외부 공간을 만들어드립니다.',
  '["정원", "발코니", "외부공간"]'::jsonb,
  8,
  12,
  4.6,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 3. 추가된 데이터 확인
SELECT 
  id,
  company_name,
  contact_name,
  specialties,
  years_experience,
  rating,
  status,
  created_at
FROM public.contractors
ORDER BY created_at DESC
LIMIT 10;
