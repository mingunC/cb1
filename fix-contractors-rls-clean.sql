-- contractors 테이블의 모든 기존 정책 삭제 후 재생성
-- 1. 모든 기존 정책들 삭제
DROP POLICY IF EXISTS "Contractors can view their own data" ON contractors;
DROP POLICY IF EXISTS "Contractors can update their own data" ON contractors;
DROP POLICY IF EXISTS "Anyone can view active contractors" ON contractors;
DROP POLICY IF EXISTS "Admins can view all contractors" ON contractors;
DROP POLICY IF EXISTS "Admins can update all contractors" ON contractors;

-- 2. contractors 테이블에 RLS 활성화 (이미 활성화되어 있어도 안전)
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책들 생성
-- 업체는 자신의 데이터를 볼 수 있음
CREATE POLICY "Contractors can view their own data" ON contractors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 업체는 자신의 데이터를 업데이트할 수 있음
CREATE POLICY "Contractors can update their own data" ON contractors
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 관리자는 모든 업체 데이터를 볼 수 있음
CREATE POLICY "Admins can view all contractors" ON contractors
FOR SELECT
TO authenticated
USING (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
);

-- 관리자는 모든 업체 데이터를 업데이트할 수 있음
CREATE POLICY "Admins can update all contractors" ON contractors
FOR UPDATE
TO authenticated
USING (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
)
WITH CHECK (
    auth.jwt() ->> 'email' IN (
        'cmgg919@gmail.com',
        'mingun.ryan.choi@gmail.com'
    )
);

-- 4. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contractors'
ORDER BY policyname;
