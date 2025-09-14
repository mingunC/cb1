-- 회원가입 시 자동으로 public.users 테이블에 사용자 추가하는 트리거

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'family_name', 'User'),
    'customer',
    false,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. 기존 사용자들을 위한 수동 추가 (micks1@me.com 포함)
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu 
  WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;
