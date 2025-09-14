-- contractor_quotes 테이블 구조 확인

-- 1. 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 현재 데이터 확인
SELECT *
FROM public.contractor_quotes
WHERE project_id IN (
  '7658a025-d1e9-43b7-a3c1-8acfca167cc1',
  '80903f9c-d22a-4122-ad4a-dddf4b488f63'
)
ORDER BY created_at DESC;

-- 3. contractors 테이블과 조인해서 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.created_at,
  c.company_name,
  c.contact_name
FROM public.contractor_quotes cq
LEFT JOIN public.contractors c ON cq.contractor_id = c.id
WHERE cq.project_id IN (
  '7658a025-d1e9-43b7-a3c1-8acfca167cc1',
  '80903f9c-d22a-4122-ad4a-dddf4b488f63'
)
ORDER BY cq.created_at DESC;
