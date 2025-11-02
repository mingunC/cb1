-- ============================================
-- 관리자 리뷰 관리 권한 추가
-- ============================================
-- 관리자가 모든 리뷰와 댓글을 삭제 및 수정할 수 있도록 설정

-- 1. 현재 reviews 테이블의 RLS 정책 확인
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
WHERE tablename = 'reviews'
ORDER BY policyname;

-- 2. 관리자가 모든 리뷰를 조회할 수 있는 정책
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() 
        AND user_type = 'admin'
      LIMIT 1
    )
  );

-- 3. 관리자가 모든 리뷰를 수정할 수 있는 정책
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
CREATE POLICY "Admins can update all reviews" ON public.reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() 
        AND user_type = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() 
        AND user_type = 'admin'
      LIMIT 1
    )
  );

-- 4. 관리자가 모든 리뷰를 삭제할 수 있는 정책
DROP POLICY IF EXISTS "Admins can delete all reviews" ON public.reviews;
CREATE POLICY "Admins can delete all reviews" ON public.reviews
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() 
        AND user_type = 'admin'
      LIMIT 1
    )
  );

-- 5. 기존 고객 리뷰 정책 유지 (수정)
DROP POLICY IF EXISTS "Customers can view reviews" ON public.reviews;
CREATE POLICY "Customers can view reviews" ON public.reviews
  FOR SELECT
  USING (true); -- 모두가 리뷰를 볼 수 있음

DROP POLICY IF EXISTS "Customers can create reviews" ON public.reviews;
CREATE POLICY "Customers can create reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update own reviews" ON public.reviews;
CREATE POLICY "Customers can update own reviews" ON public.reviews
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can delete own reviews" ON public.reviews;
CREATE POLICY "Customers can delete own reviews" ON public.reviews
  FOR DELETE
  USING (auth.uid() = customer_id);

-- 6. 업체가 자신의 리뷰에 답글을 작성할 수 있는 정책 (contractor_reply)
DROP POLICY IF EXISTS "Contractors can reply to their reviews" ON public.reviews;
CREATE POLICY "Contractors can reply to their reviews" ON public.reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.contractors 
      WHERE id = reviews.contractor_id 
        AND user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.contractors 
      WHERE id = reviews.contractor_id 
        AND user_id = auth.uid()
      LIMIT 1
    )
  );

-- 7. 정책 확인
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual::text, 1, 100)
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'CHECK: ' || substring(with_check::text, 1, 100)
    ELSE 'No CHECK clause'
  END as check_clause
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;

-- 8. 관리자 권한 확인 함수 (이미 있다면 스킵)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND user_type = 'admin'
  );
END;
$$;

-- 9. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 관리자 리뷰 관리 권한이 추가되었습니다!';
  RAISE NOTICE '📋 관리자는 이제 모든 리뷰를 조회, 수정, 삭제할 수 있습니다.';
  RAISE NOTICE '🔒 고객과 업체의 기존 권한은 유지됩니다.';
END $$;
