-- users 테이블 RLS 정책 문제 해결

-- 1. 현재 users 테이블의 RLS 정책 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. users 테이블의 모든 RLS 정책 삭제
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "auth_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_select_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- 3. 간단하고 안전한 RLS 정책 재생성
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. 관리자 정책 (더 간단하게)
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.user_type = 'admin'
        )
    );

-- 5. 정책 확인
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. micks1@me.com 사용자 데이터 확인
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name
FROM public.users 
WHERE email = 'micks1@me.com';
