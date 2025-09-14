-- 기존 RLS 정책 삭제 및 재생성

-- 1. users 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for users" ON public.users;
DROP POLICY IF EXISTS "auth_users_insert_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_select_own" ON public.users;
DROP POLICY IF EXISTS "auth_users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- 2. 깔끔한 users 테이블 RLS 정책 재생성
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- 3. 정리된 users 테이블 정책 확인
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