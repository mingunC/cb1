-- 관리자 이메일 확인 및 정책 수정
-- 1. 현재 사용자들 확인
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- 2. 관리자 업데이트 정책 삭제 (기존 것 있다면)
DROP POLICY IF EXISTS "Admins can update quote requests" ON quote_requests;

-- 3. 실제 관리자 이메일로 정책 재생성
CREATE POLICY "Admins can update quote requests" ON quote_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE users.id = auth.uid() 
        AND users.email = 'mingun.ryan.choi@gmail.com'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE users.id = auth.uid() 
        AND users.email = 'mingun.ryan.choi@gmail.com'
    )
);

-- 4. 또는 모든 인증된 사용자가 업데이트할 수 있도록 허용 (임시 해결책)
-- DROP POLICY IF EXISTS "Admins can update quote requests" ON quote_requests;
-- CREATE POLICY "Authenticated users can update quote requests" ON quote_requests
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
