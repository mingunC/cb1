-- micks1@me.com을 업체로 변경

-- 1. 기존 사용자 정보 확인
SELECT id, email, user_type FROM public.users WHERE email = 'micks1@me.com';

-- 2. user_type을 contractor로 변경
UPDATE public.users 
SET user_type = 'contractor'
WHERE email = 'micks1@me.com';

-- 3. pros 테이블에 업체 정보가 있는지 확인
SELECT * FROM public.pros WHERE user_id = (
  SELECT id FROM public.users WHERE email = 'micks1@me.com'
);

-- 4. pros 테이블에 업체 정보가 없다면 추가
INSERT INTO public.pros (
  user_id,
  company_name,
  contact_name,
  phone,
  email,
  address,
  license_number,
  insurance_info,
  specialties,
  years_experience,
  status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.first_name || ' ' || u.last_name, 'Company Name') as company_name,
  COALESCE(u.first_name || ' ' || u.last_name, 'Contact Name') as contact_name,
  NULL as phone,
  u.email,
  NULL as address,
  NULL as license_number,
  NULL as insurance_info,
  '[]'::jsonb as specialties,
  0 as years_experience,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM public.users u
WHERE u.email = 'micks1@me.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.pros p WHERE p.user_id = u.id
  );

-- 5. 변경 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  p.company_name,
  p.contact_name,
  p.status
FROM public.users u
LEFT JOIN public.pros p ON p.user_id = u.id
WHERE u.email = 'micks1@me.com';
