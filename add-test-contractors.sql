-- 테스트용 업체 데이터 추가

-- 1. 기존 contractors 테이블 확인
SELECT * FROM public.contractors LIMIT 5;

-- 2. 테스트용 업체 데이터 추가 (이미 있는 경우 무시)
INSERT INTO public.contractors (
  id,
  user_id,
  company_name,
  contact_name,
  email,
  phone,
  specialties,
  years_experience,
  bio,
  website,
  is_verified,
  is_active,
  service_areas
) VALUES 
(
  'contractor-1',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '김리노베이션',
  '김대표',
  'kim@renovation.com',
  '010-1234-5678',
  ARRAY['주방', '욕실', '전체'],
  15,
  '15년간 주방과 욕실 리노베이션에 특화된 전문 업체입니다. 고품질 재료와 세심한 시공으로 고객 만족도를 높이고 있습니다.',
  'https://kimrenovation.com',
  true,
  true,
  ARRAY['서울 강남구', '서울 서초구']
),
(
  'contractor-2',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '퍼펙트홈',
  '박대표',
  'park@perfecthome.com',
  '010-2345-6789',
  ARRAY['욕실', '지하실', '발코니'],
  12,
  '욕실과 지하실 리노베이션 전문 업체입니다. 현대적이고 실용적인 디자인으로 공간을 새롭게 만들어드립니다.',
  'https://perfecthome.com',
  true,
  true,
  ARRAY['서울 송파구', '서울 강동구']
),
(
  'contractor-3',
  (SELECT id FROM auth.users WHERE email = 'mystars100826@gmail.com'),
  '스마트리노',
  '이대표',
  'lee@smartreno.com',
  '010-3456-7890',
  ARRAY['주방', '전체', '인테리어'],
  18,
  '18년 경력의 리노베이션 전문 업체입니다. 스마트한 디자인과 친환경 재료를 사용하여 건강한 공간을 만들어드립니다.',
  'https://smartreno.com',
  true,
  true,
  ARRAY['서울 마포구', '서울 영등포구']
)
ON CONFLICT (id) DO NOTHING;

-- 3. 테스트용 포트폴리오 데이터 추가
INSERT INTO public.portfolios (
  id,
  contractor_id,
  title,
  description,
  project_type,
  space_type,
  budget_range,
  completion_date,
  photos,
  thumbnail_url,
  is_featured
) VALUES 
(
  'portfolio-1',
  'contractor-1',
  '모던 주방 리노베이션',
  '화이트 톤의 깔끔한 모던 주방으로 완전히 새롭게 단장했습니다.',
  '주방',
  'detached-house',
  '50k-100k',
  '2024-01-15',
  ARRAY['kitchen1.jpg', 'kitchen2.jpg'],
  'kitchen1.jpg',
  true
),
(
  'portfolio-2',
  'contractor-1',
  '럭셔리 욕실 리노베이션',
  '대리석과 골드 액센트로 고급스러운 욕실을 완성했습니다.',
  '욕실',
  'detached-house',
  '30k-50k',
  '2024-01-10',
  ARRAY['bathroom1.jpg', 'bathroom2.jpg'],
  'bathroom1.jpg',
  true
),
(
  'portfolio-3',
  'contractor-2',
  '지하실 홈오피스',
  '지하실을 활용한 홈오피스 공간을 조성했습니다.',
  '지하실',
  'detached-house',
  '20k-30k',
  '2024-01-05',
  ARRAY['basement1.jpg'],
  'basement1.jpg',
  false
)
ON CONFLICT (id) DO NOTHING;

-- 4. 추가된 데이터 확인
SELECT 
  c.id,
  c.company_name,
  c.contact_name,
  c.specialties,
  c.years_experience,
  c.is_verified,
  COUNT(p.id) as portfolio_count
FROM public.contractors c
LEFT JOIN public.portfolios p ON c.id = p.contractor_id
WHERE c.id IN ('contractor-1', 'contractor-2', 'contractor-3')
GROUP BY c.id, c.company_name, c.contact_name, c.specialties, c.years_experience, c.is_verified
ORDER BY c.company_name;
