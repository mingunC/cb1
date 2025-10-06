-- portfolios 테이블 완전 진단 스크립트
-- 작성일: 2024-10-06

-- 1. portfolios 테이블이 존재하는지 확인
SELECT 
  'Step 1: Table exists?' as step,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'portfolios'
  ) as table_exists;

-- 2. portfolios 테이블 구조 확인
SELECT 
  'Step 2: Table structure' as step,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'portfolios'
ORDER BY ordinal_position;

-- 3. Foreign Key 제약조건 확인
SELECT
  'Step 3: Foreign Keys' as step,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'portfolios';

-- 4. contractors 테이블 확인 (대상 테이블)
SELECT 
  'Step 4: contractors table' as step,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'contractors'
  AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;

-- 5. 실제 데이터 확인
SELECT 
  'Step 5: Data in portfolios' as step,
  COUNT(*) as total_count
FROM portfolios;

-- 6. 수동 JOIN 테스트 (이게 작동하는지 확인)
SELECT 
  'Step 6: Manual JOIN test' as step,
  p.id as portfolio_id,
  p.title,
  p.contractor_id,
  c.id as contractor_table_id,
  c.company_name
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
LIMIT 3;

-- 7. PostgREST 설정 확인
SELECT 
  'Step 7: PostgREST settings' as step,
  current_setting('pgrst.db_schemas', true) as db_schemas,
  current_setting('pgrst.db_anon_role', true) as anon_role;

-- 문제 해결 방법들:

-- 해결 1: Foreign Key 다시 추가 (이미 있으면 스킵됨)
DO $$
BEGIN
  -- 기존 FK 삭제 시도
  ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_contractor_id_fkey;
  
  -- 새로 추가
  ALTER TABLE portfolios 
  ADD CONSTRAINT portfolios_contractor_id_fkey 
  FOREIGN KEY (contractor_id) 
  REFERENCES contractors(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE 'Foreign key recreated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 해결 2: 스키마 캐시 강제 새로고침
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 해결 3: RLS 정책 확인 및 재생성
DROP POLICY IF EXISTS "Anyone can view portfolios" ON portfolios;
CREATE POLICY "Anyone can view portfolios" ON portfolios
  FOR SELECT USING (true);

-- 최종 확인
SELECT 
  '✅ Diagnosis complete!' as result,
  'Check the results above to identify the issue' as next_step;
