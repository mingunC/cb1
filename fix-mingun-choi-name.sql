-- mingun choi 사용자 이름에서 'User' 제거
-- 이메일: ryan.mingun.choi@gmail.com

-- 1. 현재 상태 확인
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  au.raw_user_meta_data->>'given_name' as google_given_name,
  au.raw_user_meta_data->>'family_name' as google_family_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'ryan.mingun.choi@gmail.com';

-- 2. 이름 수정
UPDATE public.users 
SET 
  first_name = CASE
    -- 'User' 문자열 제거
    WHEN first_name LIKE '%User%' THEN TRIM(REPLACE(first_name, 'User', ''))
    WHEN first_name LIKE '%user%' THEN TRIM(REPLACE(first_name, 'user', ''))
    ELSE first_name
  END,
  last_name = CASE
    -- last_name이 'User'이면 NULL로 설정
    WHEN last_name = 'User' OR last_name = 'user' THEN NULL
    ELSE last_name
  END,
  updated_at = NOW()
WHERE email = 'ryan.mingun.choi@gmail.com';

-- 3. 결과 확인
SELECT 
  email,
  first_name,
  last_name,
  CONCAT(first_name, ' ', COALESCE(last_name, '')) as full_name
FROM public.users
WHERE email = 'ryan.mingun.choi@gmail.com';
