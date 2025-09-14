-- micks1@me.com 계정 정보 확인
-- 1. auth.users에서 확인
SELECT id, email, created_at FROM auth.users WHERE email = 'micks1@me.com';

-- 2. contractors 테이블에서 확인
SELECT * FROM contractors WHERE email = 'micks1@me.com';

-- 3. user_profiles 테이블에서 확인 (있다면)
SELECT * FROM user_profiles WHERE email = 'micks1@me.com';

-- 4. 현재 로그인한 사용자 확인
SELECT auth.uid() as current_user_id;
