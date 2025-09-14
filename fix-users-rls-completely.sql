-- users 테이블 RLS 완전 해결

-- 1. 모든 RLS 정책 삭제
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "auth_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_select_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- 2. RLS 비활성화 (임시)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. 간단한 RLS 재활성화 및 정책 생성
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. 가장 기본적인 정책만 생성
CREATE POLICY "Allow authenticated users to read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. 정책 확인
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. 테스트 쿼리
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name
FROM public.users 
WHERE email = 'micks1@me.com';
