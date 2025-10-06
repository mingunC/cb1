-- Supabase 스키마 캐시 새로고침 (Foreign Key는 이미 존재함)

-- 1. Foreign Key 관계 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'portfolios';

-- 결과: portfolios.contractor_id -> contractors.id 관계가 표시되어야 함

-- 2. 스키마 캐시 새로고침 (가장 중요!)
NOTIFY pgrst, 'reload schema';

-- 3. 테스트 쿼리
SELECT 
  p.id,
  p.title,
  p.contractor_id,
  c.company_name,
  c.company_logo
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC
LIMIT 5;

-- 4. 포트폴리오 개수 확인
SELECT 
  'Total portfolios' as info,
  COUNT(*) as count
FROM portfolios;

-- 5. 업체별 포트폴리오 개수
SELECT 
  c.company_name,
  COUNT(p.id) as portfolio_count
FROM contractors c
LEFT JOIN portfolios p ON p.contractor_id = c.id
GROUP BY c.company_name
ORDER BY portfolio_count DESC;

SELECT '✅ Schema cache refreshed! Please refresh your browser (Ctrl+F5)' as result;
