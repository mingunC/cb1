-- Google OAuth 로그인 시 실제 메타데이터 확인
SELECT 
  id,
  email,
  created_at,
  user_metadata,
  raw_user_meta_data,
  raw_user_meta_data->>'name' as full_name,
  raw_user_meta_data->>'given_name' as given_name,
  raw_user_meta_data->>'family_name' as family_name,
  raw_user_meta_data->>'picture' as picture_url
FROM auth.users 
WHERE provider = 'google'
  AND email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- public.users 테이블의 실제 저장된 데이터와 비교
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  au.raw_user_meta_data->>'name' as google_full_name,
  au.raw_user_meta_data->>'given_name' as google_given_name,
  au.raw_user_meta_data->>'family_name' as google_family_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.provider = 'google'
  AND u.email IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 10;
