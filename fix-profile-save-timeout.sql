-- ============================================
-- Profile Save Timeout Fix
-- ============================================
-- 이 스크립트는 프로필 저장 시 발생하는 타임아웃을 해결합니다.
-- 문제: Request timeout (10 seconds) 에러
-- 원인: RLS 정책이 최적화되지 않아 쿼리 실행 시간 증가
-- 해결: RLS 정책 최적화 + 인덱스 개선

-- ============================================
-- 1. 현재 상태 확인
-- ============================================

-- 현재 UPDATE 정책 확인
SELECT 
  policyname, 
  cmd, 
  qual::text as using_clause,
  with_check::text as check_clause
FROM pg_policies
WHERE tablename = 'contractors' 
  AND cmd = 'UPDATE';

-- 현재 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'contractors'
  AND indexname LIKE '%user_id%';

-- ============================================
-- 2. RLS 정책 최적화
-- ============================================

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Contractors can update own data" ON public.contractors;
DROP POLICY IF EXISTS "Admins can manage all contractors" ON public.contractors;

-- 최적화된 UPDATE 정책 생성
-- USING과 WITH CHECK 절을 모두 명시하여 성능 향상
CREATE POLICY "Contractors can update own data" ON public.contractors
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 관리자 정책 재생성 (성능 최적화)
CREATE POLICY "Admins can manage all contractors" ON public.contractors
  FOR ALL 
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

-- ============================================
-- 3. 인덱스 최적화
-- ============================================

-- 기존 user_id 인덱스 삭제
DROP INDEX IF EXISTS idx_contractors_user_id;

-- 부분 인덱스로 재생성 (NULL 제외 - 성능 향상)
CREATE INDEX idx_contractors_user_id 
ON public.contractors(user_id) 
WHERE user_id IS NOT NULL;

-- id 컬럼에 인덱스 추가 (PRIMARY KEY이지만 명시적 확인)
-- PostgreSQL은 자동으로 PRIMARY KEY에 인덱스를 생성하므로 이미 존재함

-- updated_at 인덱스 추가 (정렬 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_contractors_updated_at 
ON public.contractors(updated_at DESC);

-- ============================================
-- 4. 트리거 최적화
-- ============================================

-- updated_at 트리거 함수 최적화
CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- CURRENT_TIMESTAMP가 NOW()보다 빠름
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 기존 트리거 재생성 (이미 존재하면 대체)
DROP TRIGGER IF EXISTS update_contractors_updated_at ON public.contractors;

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_contractors_updated_at();

-- ============================================
-- 5. 통계 업데이트
-- ============================================

-- 테이블 통계 업데이트 (쿼리 플래너 최적화)
ANALYZE public.contractors;

-- ============================================
-- 6. PostgREST 캐시 새로고침
-- ============================================

-- PostgREST에 스키마 변경 알림
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. 결과 확인
-- ============================================

-- 변경된 정책 확인
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text 
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text 
    ELSE 'No CHECK clause'
  END as check_clause
FROM pg_policies
WHERE tablename = 'contractors'
ORDER BY cmd, policyname;

-- 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'contractors'
ORDER BY indexname;

-- 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'contractors'
ORDER BY trigger_name;

-- 테이블 통계 확인
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'contractors';

-- ============================================
-- 8. 성능 테스트 쿼리
-- ============================================

-- 실제 UPDATE 쿼리 실행 계획 확인
-- (실제 user_id로 대체하여 테스트)
EXPLAIN ANALYZE
UPDATE public.contractors
SET 
  company_name = company_name,
  updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM public.contractors LIMIT 1);

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Profile save optimization completed!';
  RAISE NOTICE '📊 Please verify the results above';
  RAISE NOTICE '🔄 Refresh your browser and try saving profile again';
END $$;
