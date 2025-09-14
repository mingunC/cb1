-- mystars100826@gmail.com 사용자의 프로필 생성
-- Supabase SQL Editor에서 실행

-- 현재 auth.users에서 해당 사용자 ID 확인
SELECT id, email, created_at FROM auth.users WHERE email = 'mystars100826@gmail.com';

-- 해당 사용자의 프로필이 users 테이블에 있는지 확인
SELECT * FROM users WHERE email = 'mystars100826@gmail.com';

-- 프로필이 없다면 생성 (users 테이블 구조에 맞게 조정 필요)
-- 기본 구조로 시도해보세요:
INSERT INTO users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE email = 'mystars100826@gmail.com'
ON CONFLICT (id) DO NOTHING;
