-- contractor_quotes 테이블에 올바른 필드명으로 테스트 데이터 추가

-- 1. 현재 데이터 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.price,
  cq.description,
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

-- 2. price가 null인 경우 테스트 값으로 업데이트
UPDATE public.contractor_quotes 
SET price = 3500.00
WHERE project_id = '7658a025-d1e9-43b7-a3c1-8acfca167cc1'
AND price IS NULL;

UPDATE public.contractor_quotes 
SET price = 3333.00
WHERE project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63'
AND price IS NULL;

-- 3. description이 비어있는 경우 테스트 설명 추가
UPDATE public.contractor_quotes 
SET description = '주방과 욕실 리노베이션 견적서입니다. 고품질 재료와 전문 시공을 제공합니다.'
WHERE project_id = '7658a025-d1e9-43b7-a3c1-8acfca167cc1'
AND (description IS NULL OR description = '');

UPDATE public.contractor_quotes 
SET description = '전문적인 리노베이션 서비스를 제공합니다. 합리적인 가격과 우수한 품질을 보장합니다.'
WHERE project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63'
AND (description IS NULL OR description = '');

-- 4. 업데이트 후 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.price,
  cq.description,
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
