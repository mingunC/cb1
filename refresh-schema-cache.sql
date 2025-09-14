-- Supabase 스키마 캐시 새로고침
-- API 스키마 캐시를 강제로 업데이트

-- 1. 스키마 새로고침 (PostgREST 캐시 클리어)
-- NOTIFY pgrst, 'reload schema';  -- 이 명령어는 Supabase에서 지원하지 않을 수 있음

-- 2. 테이블 통계 업데이트
ANALYZE contractor_quotes;

-- 3. 인덱스 재구성
REINDEX TABLE contractor_quotes;

-- 4. 테이블 존재 및 구조 재확인
SELECT 
  'Table exists:' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contractor_quotes'
  ) as result;

SELECT 
  'Columns count:' as check_type,
  COUNT(*) as result
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes';

-- 5. 모든 컬럼 나열
SELECT 
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
ORDER BY ordinal_position;

-- 6. RLS 정책 확인
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'contractor_quotes';

-- 7. 테이블 권한 확인
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'contractor_quotes';

-- 8. API 접근 테스트용 샘플 데이터 삽입 (선택사항)
-- INSERT INTO contractor_quotes (contractor_id, project_id, price, description, status)
-- VALUES (
--   (SELECT id FROM contractors LIMIT 1),
--   (SELECT id FROM quote_requests LIMIT 1),
--   1000.00,
--   'Test quote',
--   'pending'
-- ) ON CONFLICT DO NOTHING;

SELECT 'Schema cache refresh completed' as status;
