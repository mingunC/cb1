-- mingun choi 사용자 이름 최종 수정
-- "mingun choi User" → "mingun choi"로 변경

-- 1. 먼저 현재 상태 확인
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.user_type,
  au.raw_user_meta_data->>'given_name' as google_given_name,
  au.raw_user_meta_data->>'family_name' as google_family_name,
  au.raw_user_meta_data->>'full_name' as google_full_name
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'ryan.mingun.choi@gmail.com';

-- 2. 이름 수정 (모든 'User' 제거)
UPDATE public.users 
SET 
  first_name = 'mingun',
  last_name = 'choi',
  updated_at = NOW()
WHERE email = 'ryan.mingun.choi@gmail.com';

-- 3. auth.users 테이블의 raw_user_meta_data도 확인하고 필요시 수정
-- (이 부분은 Supabase Dashboard에서 직접 확인해야 할 수 있습니다)

-- 4. 수정 결과 확인
SELECT 
  email,
  first_name,
  last_name,
  CONCAT(first_name, ' ', last_name) as full_name,
  user_type
FROM public.users
WHERE email = 'ryan.mingun.choi@gmail.com';

-- 5. contractors 테이블도 확인 (혹시 업체 계정인 경우)
SELECT 
  c.id,
  c.company_name,
  c.contact_name,
  c.email,
  u.email as user_email,
  u.first_name,
  u.last_name
FROM contractors c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE c.email = 'ryan.mingun.choi@gmail.com' 
   OR u.email = 'ryan.mingun.choi@gmail.com';
