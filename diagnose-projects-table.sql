-- projects 테이블 404 에러 진단 스크립트
-- 작성일: 2024-10-06

-- 1. projects 테이블이 존재하는지 확인
SELECT 
  'Step 1: Table exists?' as step,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) as table_exists;

-- 2. projects 테이블 구조 확인
SELECT 
  'Step 2: Table structure' as step,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- 3. RLS (Row Level Security) 정책 확인
SELECT 
  'Step 3: RLS Policies' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'projects';

-- 4. RLS 활성화 상태 확인
SELECT 
  'Step 4: RLS enabled?' as step,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'projects';

-- 5. 실제 데이터 확인
SELECT 
  'Step 5: Data count' as step,
  COUNT(*) as total_projects
FROM projects;

-- 6. selected_contractor_id 컬럼 데이터 확인
SELECT 
  'Step 6: selected_contractor_id data' as step,
  selected_contractor_id,
  COUNT(*) as count
FROM projects 
WHERE selected_contractor_id IS NOT NULL
GROUP BY selected_contractor_id;

-- 7. PostgREST 스키마 노출 확인
SELECT 
  'Step 7: Schema exposure' as step,
  current_setting('pgrst.db_schemas', true) as db_schemas,
  current_setting('pgrst.db_anon_role', true) as anon_role;

-- 8. 권한 확인
SELECT 
  'Step 8: Permissions' as step,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'projects'
  AND grantee IN ('anon', 'authenticated', 'public');

-- 문제 해결 방법들:

-- 해결 1: RLS 정책 생성/수정
DO $$
BEGIN
  -- 기존 정책 삭제
  DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
  DROP POLICY IF EXISTS "Anyone can select projects" ON projects;
  
  -- 새 정책 생성
  CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);
    
  RAISE NOTICE 'RLS policies created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- 해결 2: RLS 비활성화 (임시 해결책)
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 해결 3: 권한 부여
GRANT SELECT ON projects TO anon;
GRANT SELECT ON projects TO authenticated;

-- 해결 4: 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 최종 확인
SELECT 
  '✅ Diagnosis complete!' as result,
  'Check the results above to identify the issue' as next_step;
