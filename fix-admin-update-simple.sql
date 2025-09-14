-- 간단한 해결책: 특정 관리자 이메일들만 업데이트 허용
-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Admins can update quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can manage all quote requests" ON quote_requests;

-- 특정 이메일들만 허용하는 정책 생성
CREATE POLICY "Specific admins can update quote requests" ON quote_requests
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

-- 또는 모든 인증된 사용자가 업데이트할 수 있도록 허용 (임시 해결책)
-- CREATE POLICY "Authenticated users can update quote requests" ON quote_requests
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
