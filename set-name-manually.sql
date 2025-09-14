-- 수동으로 이름을 올바르게 설정
-- Supabase SQL Editor에서 실행

-- 수동으로 이름 분리
UPDATE public.users 
SET 
  first_name = 'mingun',
  last_name = 'choi',
  updated_at = NOW()
WHERE email = 'cmgg919@gmail.com';

-- 결과 확인
SELECT 
  u.id,
  u.email,
  u.user_type,
  u.first_name,
  u.last_name,
  u.updated_at
FROM public.users u
WHERE u.email = 'cmgg919@gmail.com';
