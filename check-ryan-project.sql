-- ryan choi 고객의 실제 프로젝트 확인
-- 프로젝트 ID: 80903f9c-d22a-4122-ad4a-dddf4b488f63

-- 1. 해당 프로젝트의 상세 정보 확인
SELECT 
  qr.id,
  qr.customer_id,
  qr.space_type,
  qr.project_types,
  qr.budget,
  qr.timeline,
  qr.visit_date,
  qr.full_address,
  qr.postal_code,
  qr.description,
  qr.photos,
  qr.status,
  qr.created_at,
  qr.updated_at,
  au.email as customer_email
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
WHERE qr.id = '80903f9c-d22a-4122-ad4a-dddf4b488f63';

-- 2. 해당 프로젝트에 제출된 업체 견적서 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.price,
  cq.description,
  cq.pdf_url,
  cq.pdf_filename,
  cq.status,
  cq.created_at,
  c.company_name,
  c.contact_name
FROM public.contractor_quotes cq
LEFT JOIN public.contractors c ON cq.contractor_id = c.id
WHERE cq.project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63'
ORDER BY cq.created_at DESC;

-- 3. 프로젝트 상태 업데이트 (필요시)
-- UPDATE public.quote_requests 
-- SET status = 'quote-submitted'
-- WHERE id = '80903f9c-d22a-4122-ad4a-dddf4b488f63';

-- 4. 업체 견적서가 있다면 비교견적 탭에서 확인 가능
SELECT 
  COUNT(*) as quote_count,
  AVG(cq.price) as avg_price,
  MIN(cq.price) as min_price,
  MAX(cq.price) as max_price
FROM public.contractor_quotes cq
WHERE cq.project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63';
