-- 관리자가 견적 요청을 업데이트할 수 있도록 RLS 정책 추가
-- 기존 정책 확인
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quote_requests';

-- 관리자 업데이트 정책 추가
CREATE POLICY "Admins can update quote requests" ON quote_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE users.id = auth.uid() 
        AND users.email = 'admin@example.com'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE users.id = auth.uid() 
        AND users.email = 'admin@example.com'
    )
);
