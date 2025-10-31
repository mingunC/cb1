-- Portfolios RLS 및 데이터 진단 쿼리

-- 1. 현재 로그인한 사용자의 contractor_id 확인
SELECT 
  auth.uid() as my_user_id,
  c.id as my_contractor_id,
  c.company_name
FROM contractors c
WHERE c.user_id = auth.uid();

-- 2. Portfolios와 contractor 매핑 확인
SELECT 
  p.id as portfolio_id,
  p.title,
  p.contractor_id,
  c.company_name,
  c.user_id,
  CASE 
    WHEN c.user_id = auth.uid() THEN '✅ 내 포트폴리오'
    ELSE '❌ 다른 업체'
  END as ownership
FROM portfolios p
LEFT JOIN contractors c ON c.id = p.contractor_id
ORDER BY p.created_at DESC;

-- 3. Portfolios RLS 정책 확인
SELECT 
  policyname,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename = 'portfolios'
ORDER BY cmd, policyname;

-- 4. Portfolios 테이블에 RLS가 활성화되어 있는지 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('portfolios', 'events', 'contractors')
  AND schemaname = 'public';

