-- 관리자 계정 생성 SQL
-- 1. 먼저 일반 회원가입을 통해 계정을 생성한 후
-- 2. Supabase SQL Editor에서 다음 명령어 실행

-- 특정 이메일을 관리자로 변경
UPDATE auth.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@domain.com';

-- 또는 새로운 관리자 계정 생성 (비밀번호는 별도 설정 필요)
INSERT INTO auth.users (id, email, role, email_confirmed_at, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'admin@yourdomain.com',
  'admin',
  NOW(),
  NOW(),
  NOW()
);
