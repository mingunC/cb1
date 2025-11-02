-- ============================================
-- 관리자 리뷰 관리 권한 추가 (이메일 기반)
-- ============================================
-- 관리자가 모든 리뷰와 댓글을 삭제 및 수정할 수 있도록 설정

-- 관리자 이메일
DO $$
BEGIN
  RAISE NOTICE '🔑 관리자 이메일: cmgg919@gmail.com';
END $$;

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

-- 2. 기존 관리자 정책 삭제
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete all reviews" ON public.reviews;

-- 3. 이메일 기반 관리자 정책 생성

-- 관리자가 모든 리뷰를 조회할 수 있는 정책
CREATE POLICY "Admin email can view all reviews" ON public.reviews
  FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'email') = 'cmgg919@gmail.com'
  );

-- 관리자가 모든 리뷰를 수정할 수 있는 정책
CREATE POLICY "Admin email can update all reviews" ON public.reviews
  FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'email') = 'cmgg919@gmail.com'
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') = 'cmgg919@gmail.com'
  );

-- 관리자가 모든 리뷰를 삭제할 수 있는 정책
CREATE POLICY "Admin email can delete all reviews" ON public.reviews
  FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'email') = 'cmgg919@gmail.com'
  );

-- 4. 기존 고객 리뷰 정책 유지
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

-- 5. 업체가 자신의 리뷰에 답글을 작성할 수 있는 정책 (contractor_reply)
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

-- 6. 정책 확인
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual::text, 1, 150)
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'CHECK: ' || substring(with_check::text, 1, 150)
    ELSE 'No CHECK clause'
  END as check_clause
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;

-- 7. RLS가 활성화되어 있는지 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'reviews';

-- 8. RLS가 비활성화되어 있다면 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 9. 테스트 쿼리 (관리자로 로그인한 상태에서 실행)
-- SELECT * FROM reviews LIMIT 5;

-- 10. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 관리자 리뷰 관리 권한이 추가되었습니다! (이메일 기반)';
  RAISE NOTICE '📋 관리자(cmgg919@gmail.com)는 이제 모든 리뷰를 조회, 수정, 삭제할 수 있습니다.';
  RAISE NOTICE '🔒 고객과 업체의 기존 권한은 유지됩니다.';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 테스트 방법:';
  RAISE NOTICE '1. cmgg919@gmail.com으로 로그인';
  RAISE NOTICE '2. /admin/reviews 페이지 방문';
  RAISE NOTICE '3. 모든 리뷰가 표시되는지 확인';
END $$;
