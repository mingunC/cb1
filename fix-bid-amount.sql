-- contractor_quotes 테이블의 bid_amount 필드 확인 및 수정

-- 1. 현재 contractor_quotes 데이터 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.bid_amount,
  cq.bid_description,
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

-- 2. bid_amount가 null인 경우 테스트 값으로 업데이트
UPDATE public.contractor_quotes 
SET bid_amount = 3500.00
WHERE project_id = '7658a025-d1e9-43b7-a3c1-8acfca167cc1'
AND bid_amount IS NULL;

UPDATE public.contractor_quotes 
SET bid_amount = 3333.00
WHERE project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63'
AND bid_amount IS NULL;

-- 3. 업데이트 후 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.bid_amount,
  cq.bid_description,
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
