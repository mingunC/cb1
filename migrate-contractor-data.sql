-- 기존 업체 데이터를 contractors 테이블로 마이그레이션

-- 1. 현재 contractor 타입 사용자들 확인
SELECT 
  id,
  email,
  first_name,
  last_name,
  user_type,
  created_at
FROM public.users 
WHERE user_type = 'contractor'
ORDER BY created_at DESC;

-- 2. 기존 업체들을 contractors 테이블에 추가
INSERT INTO public.contractors (
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
  u.id as user_id,
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
  u.created_at,
  u.updated_at
FROM public.users u
WHERE u.user_type = 'contractor'
  AND NOT EXISTS (
    SELECT 1 FROM public.contractors c WHERE c.user_id = u.id
  );

-- 3. 마이그레이션 결과 확인
SELECT 
  c.id as contractor_id,
  c.user_id,
  c.company_name,
  c.contact_name,
  c.status,
  u.email,
  u.user_type
FROM public.contractors c
JOIN public.users u ON u.id = c.user_id
WHERE u.user_type = 'contractor'
ORDER BY c.created_at DESC;

-- 4. micks1@me.com 업체 정보 확인
SELECT 
  c.id as contractor_id,
  c.user_id,
  c.company_name,
  c.contact_name,
  c.status,
  u.email,
  u.user_type
FROM public.contractors c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';
