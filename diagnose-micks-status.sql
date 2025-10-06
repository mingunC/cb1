-- Micks 업체의 모든 견적서 상태 확인 (상세 버전)

-- 1. Micks Construction 정보 확인
SELECT 
  'Step 1: Micks 업체 정보' as step,
  id, 
  company_name, 
  contact_name, 
  user_id,
  created_at
FROM contractors
WHERE company_name ILIKE '%Micks%'
   OR contact_name ILIKE '%Micks%';

-- 2. Micks가 제출한 모든 견적서 (상태 무관)
SELECT 
  'Step 2: Micks가 제출한 모든 견적서' as step,
  cq.id as quote_id,
  cq.project_id,
  cq.contractor_id,
  cq.status as quote_status,
  cq.price,
  cq.created_at as quote_date,
  c.company_name
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
WHERE c.company_name ILIKE '%Micks%'
   OR c.contact_name ILIKE '%Micks%'
ORDER BY cq.created_at DESC;

-- 3. Micks가 참여한 프로젝트의 전체 상태
SELECT 
  'Step 3: Micks 프로젝트 상태' as step,
  qr.id as project_id,
  qr.status as project_status,
  qr.full_address,
  qr.budget,
  qr.created_at as project_created,
  qr.updated_at as project_updated,
  cq.id as quote_id,
  cq.status as quote_status,
  cq.price as micks_price,
  cq.created_at as quote_date
FROM quote_requests qr
JOIN contractor_quotes cq ON cq.project_id = qr.id
JOIN contractors c ON c.user_id = cq.contractor_id
WHERE c.company_name ILIKE '%Micks%'
   OR c.contact_name ILIKE '%Micks%'
ORDER BY qr.updated_at DESC;

-- 4. 모든 contractor_quotes의 상태별 집계
SELECT 
  'Step 4: 전체 견적서 상태 집계' as step,
  cq.status,
  COUNT(*) as count
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
WHERE c.company_name ILIKE '%Micks%'
   OR c.contact_name ILIKE '%Micks%'
GROUP BY cq.status;

-- 5. Micks의 견적서가 있는 프로젝트에서 선택된 업체 확인
SELECT 
  'Step 5: Micks 프로젝트에서 선택된 업체' as step,
  qr.id as project_id,
  qr.full_address,
  qr.status as project_status,
  cq.id as quote_id,
  cq.status as quote_status,
  c.company_name,
  cq.price,
  CASE 
    WHEN cq.status = 'accepted' THEN '✅ 이 업체가 선택됨'
    WHEN cq.status = 'submitted' THEN '대기 중'
    WHEN cq.status = 'rejected' THEN '거절됨'
    ELSE cq.status
  END as status_description
FROM quote_requests qr
JOIN contractor_quotes cq ON cq.project_id = qr.id
JOIN contractors c ON c.user_id = cq.contractor_id
WHERE qr.id IN (
  SELECT DISTINCT cq2.project_id
  FROM contractor_quotes cq2
  JOIN contractors c2 ON c2.user_id = cq2.contractor_id
  WHERE c2.company_name ILIKE '%Micks%'
     OR c2.contact_name ILIKE '%Micks%'
)
ORDER BY qr.id, cq.status DESC;

-- 6. contractor_quotes 테이블의 모든 가능한 status 값 확인
SELECT 
  'Step 6: 시스템의 모든 견적서 상태' as step,
  status,
  COUNT(*) as count
FROM contractor_quotes
GROUP BY status
ORDER BY count DESC;

-- 7. Micks 관련 프로젝트의 timeline
SELECT 
  'Step 7: Micks 프로젝트 타임라인' as step,
  qr.id as project_id,
  qr.full_address,
  qr.status as current_project_status,
  cq.status as micks_quote_status,
  qr.created_at as project_start,
  cq.created_at as quote_submitted,
  qr.updated_at as last_updated,
  EXTRACT(DAY FROM (NOW() - qr.created_at)) as days_since_created,
  EXTRACT(DAY FROM (NOW() - qr.updated_at)) as days_since_updated
FROM quote_requests qr
JOIN contractor_quotes cq ON cq.project_id = qr.id
JOIN contractors c ON c.user_id = cq.contractor_id
WHERE c.company_name ILIKE '%Micks%'
   OR c.contact_name ILIKE '%Micks%'
ORDER BY qr.updated_at DESC;

-- 8. contractor_quotes 테이블 구조 확인
SELECT 
  'Step 8: contractor_quotes 테이블 구조' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contractor_quotes'
ORDER BY ordinal_position;
