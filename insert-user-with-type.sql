-- mystars100826@gmail.com 사용자의 프로필 생성 (user_type 포함)
-- Supabase SQL Editor에서 실행

-- user_type 컬럼이 있는 users 테이블에 데이터 삽입
INSERT INTO users (
  id, 
  email, 
  user_type,  -- 필수 컬럼
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
