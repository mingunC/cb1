-- mystars100826@gmail.com 사용자를 고객으로 등록
-- Supabase SQL Editor에서 실행

INSERT INTO users (
  id, 
  email, 
  user_type,
  created_at, 
  updated_at
)
SELECT 
  id, 
  email, 
  'customer' as user_type,  -- 고객으로 설정
  created_at, 
  updated_at
FROM auth.users
WHERE email = 'mystars100826@gmail.com'
ON CONFLICT (id) DO NOTHING;
