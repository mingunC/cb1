-- contractor_quotes 테이블의 PDF 파일 정보 확인

-- 1. 현재 PDF 파일 정보 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.pdf_url,
  cq.pdf_filename,
  c.company_name
FROM public.contractor_quotes cq
LEFT JOIN public.contractors c ON cq.contractor_id = c.id
WHERE cq.project_id IN (
  '7658a025-d1e9-43b7-a3c1-8acfca167cc1',
  '80903f9c-d22a-4122-ad4a-dddf4b488f63'
)
ORDER BY cq.created_at DESC;

-- 2. 테스트용 PDF URL 추가 (실제 파일이 없는 경우)
UPDATE public.contractor_quotes 
SET pdf_url = 'contractor-quotes/test-quote-1.pdf',
    pdf_filename = '견적서_테스트1.pdf'
WHERE project_id = '7658a025-d1e9-43b7-a3c1-8acfca167cc1'
AND (pdf_url IS NULL OR pdf_url = '');

UPDATE public.contractor_quotes 
SET pdf_url = 'contractor-quotes/test-quote-2.pdf',
    pdf_filename = '견적서_테스트2.pdf'
WHERE project_id = '80903f9c-d22a-4122-ad4a-dddf4b488f63'
AND (pdf_url IS NULL OR pdf_url = '');

-- 3. 업데이트 후 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.pdf_url,
  cq.pdf_filename,
  c.company_name
FROM public.contractor_quotes cq
LEFT JOIN public.contractors c ON cq.contractor_id = c.id
WHERE cq.project_id IN (
  '7658a025-d1e9-43b7-a3c1-8acfca167cc1',
  '80903f9c-d22a-4122-ad4a-dddf4b488f63'
)
ORDER BY cq.created_at DESC;
