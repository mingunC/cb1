-- cmgg919@gmail.com 사용자 확인
-- Supabase SQL Editor에서 실행

-- auth.users에서 확인
SELECT id, email, created_at
FROM auth.users
WHERE email = 'cmgg919@gmail.com';

-- public.users에서 확인
SELECT id, email, user_type, first_name, last_name
FROM users
WHERE email = 'cmgg919@gmail.com';
