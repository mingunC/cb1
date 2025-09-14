-- mystars100826@gmail.com 사용자를 고객으로 등록 (필수 컬럼 포함)
-- Supabase SQL Editor에서 실행

INSERT INTO users (
  id, 
  email, 
  user_type,
  first_name,  -- 필수 컬럼
  last_name,   -- 필수 컬럼
  is_sso_user, -- 필수 컬럼 (기본값: false)
  is_anonymous, -- 필수 컬럼 (기본값: false)
  created_at, 
  updated_at
)
SELECT 
  id, 
  email, 
  'customer' as user_type,
  '사용자' as first_name,  -- 기본 이름 설정
  '고객' as last_name,     -- 기본 성 설정
  false as is_sso_user,   -- SSO 사용자 아님
  false as is_anonymous,  -- 익명 사용자 아님
  created_at, 
  updated_at
FROM auth.users
WHERE email = 'mystars100826@gmail.com'
ON CONFLICT (id) DO NOTHING;
