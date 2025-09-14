-- micks1@me.com 사용자를 public.users 테이블에 추가
-- 고객으로 등록 (기본값)

INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  user_type,
  is_anonymous,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'given_name', au.raw_user_meta_data->>'name', 'User') as first_name,
  COALESCE(au.raw_user_meta_data->>'family_name', 'User') as last_name,
  'customer' as user_type,
  false as is_anonymous,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.email = 'micks1@me.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id
  );
