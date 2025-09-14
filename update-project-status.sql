-- ryan choi 고객의 프로젝트 상태를 quote-submitted로 업데이트
-- 비교견적 탭에서 제대로 표시되도록 함

-- 1. 현재 상태 확인
SELECT 
  qr.id,
  qr.status,
  qr.customer_id,
  au.email as customer_email,
  COUNT(cq.id) as quote_count
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
LEFT JOIN public.contractor_quotes cq ON qr.id = cq.project_id
WHERE qr.customer_id = '48497411-6ca1-49b9-bc98-c768c4e34ebb'
GROUP BY qr.id, qr.status, qr.customer_id, au.email
ORDER BY qr.created_at DESC;

-- 2. 업체 견적서가 있는 프로젝트들의 상태를 quote-submitted로 업데이트
UPDATE public.quote_requests 
SET status = 'quote-submitted'
WHERE customer_id = '48497411-6ca1-49b9-bc98-c768c4e34ebb'
AND id IN (
    SELECT DISTINCT project_id 
    FROM public.contractor_quotes 
    WHERE project_id IS NOT NULL
);

-- 3. 업데이트 후 상태 확인
SELECT 
  qr.id,
  qr.status,
  qr.customer_id,
  au.email as customer_email,
  COUNT(cq.id) as quote_count
FROM public.quote_requests qr
LEFT JOIN auth.users au ON qr.customer_id = au.id
LEFT JOIN public.contractor_quotes cq ON qr.id = cq.project_id
WHERE qr.customer_id = '48497411-6ca1-49b9-bc98-c768c4e34ebb'
GROUP BY qr.id, qr.status, qr.customer_id, au.email
ORDER BY qr.created_at DESC;

-- 4. 특정 프로젝트만 업데이트하려면 (선택사항)
-- UPDATE public.quote_requests 
-- SET status = 'quote-submitted'
-- WHERE id = '80903f9c-d22a-4122-ad4a-dddf4b488f63';
