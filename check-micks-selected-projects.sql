-- Micks 업체의 선택된 프로젝트 및 워크플로우 확인

-- 1. Micks Construction의 contractor_id 찾기
SELECT id, company_name, contact_name, user_id
FROM contractors
WHERE company_name LIKE '%Micks%';

-- 2. contractor_quotes 테이블에서 Micks의 견적서 확인 (status = 'accepted' 또는 'selected')
SELECT 
  cq.id as quote_id,
  cq.project_id,
  cq.contractor_id,
  cq.price,
  cq.status as quote_status,
  cq.created_at as quote_submitted_at,
  c.company_name,
  qr.status as project_status,
  qr.full_address,
  qr.budget
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
JOIN quote_requests qr ON qr.id = cq.project_id
WHERE c.company_name LIKE '%Micks%'
ORDER BY cq.created_at DESC;

-- 3. 프로젝트 상태 워크플로우 확인
-- pending → approved → site-visit-pending → site-visit-completed → 
-- bidding → quote-submitted → selected → completed

SELECT 
  'Project Status Flow' as info,
  'pending → approved → site-visit-pending → site-visit-completed → bidding → quote-submitted → selected → completed' as workflow;

-- 4. Micks가 참여한 프로젝트의 상태별 집계
SELECT 
  qr.status as project_status,
  COUNT(*) as count,
  STRING_AGG(DISTINCT qr.id::text, ', ') as project_ids
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
JOIN quote_requests qr ON qr.id = cq.project_id
WHERE c.company_name LIKE '%Micks%'
GROUP BY qr.status
ORDER BY 
  CASE qr.status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'site-visit-pending' THEN 3
    WHEN 'site-visit-completed' THEN 4
    WHEN 'bidding' THEN 5
    WHEN 'quote-submitted' THEN 6
    WHEN 'selected' THEN 7
    WHEN 'completed' THEN 8
    ELSE 9
  END;

-- 5. Micks가 선택된(accepted) 프로젝트 확인
SELECT 
  cq.id as quote_id,
  cq.project_id,
  qr.status as project_status,
  cq.status as quote_status,
  qr.full_address,
  qr.budget,
  cq.price,
  cq.created_at as quote_date,
  qr.updated_at as project_updated
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
JOIN quote_requests qr ON qr.id = cq.project_id
WHERE c.company_name LIKE '%Micks%'
  AND cq.status = 'accepted'
ORDER BY cq.created_at DESC;

-- 6. 프로젝트 종료(completed) 조건 확인
-- 현재 스키마 기준:
-- - contractor_quotes.status = 'accepted' : 고객이 해당 업체를 선택함
-- - quote_requests.status = 'selected' : 업체가 선택됨 (아직 프로젝트 진행 중)
-- - quote_requests.status = 'completed' : 프로젝트 완료

SELECT 
  'Project Completion Logic' as info,
  '
  1. 고객이 견적서 선택 → contractor_quotes.status = accepted
  2. 관리자가 프로젝트 상태 변경 → quote_requests.status = selected
  3. 작업 완료 후 관리자가 → quote_requests.status = completed
  ' as logic;

-- 7. 실제 프로젝트 상태별 확인 (Micks 관련)
SELECT 
  qr.id as project_id,
  qr.status as project_status,
  qr.full_address,
  COUNT(cq.id) as total_quotes,
  COUNT(CASE WHEN cq.status = 'accepted' THEN 1 END) as accepted_quotes,
  STRING_AGG(
    CASE WHEN cq.status = 'accepted' 
    THEN c.company_name 
    END, 
    ', '
  ) as accepted_contractors,
  qr.created_at as project_created,
  qr.updated_at as project_updated
FROM quote_requests qr
LEFT JOIN contractor_quotes cq ON cq.project_id = qr.id
LEFT JOIN contractors c ON c.user_id = cq.contractor_id
WHERE qr.id IN (
  SELECT DISTINCT cq2.project_id
  FROM contractor_quotes cq2
  JOIN contractors c2 ON c2.user_id = cq2.contractor_id
  WHERE c2.company_name LIKE '%Micks%'
)
GROUP BY qr.id, qr.status, qr.full_address, qr.created_at, qr.updated_at
ORDER BY qr.updated_at DESC;

-- 8. 선택받은 프로젝트가 'completed'가 아닌 경우 확인
SELECT 
  qr.id as project_id,
  qr.status as project_status,
  cq.status as quote_status,
  c.company_name,
  qr.full_address,
  qr.updated_at,
  CASE 
    WHEN qr.status = 'completed' THEN '✅ 프로젝트 종료됨'
    WHEN qr.status = 'selected' THEN '⚠️ 업체 선택됨 (진행 중)'
    WHEN cq.status = 'accepted' AND qr.status NOT IN ('selected', 'completed') THEN '❌ 선택되었으나 프로젝트 상태 업데이트 필요'
    ELSE '진행 중'
  END as status_check
FROM contractor_quotes cq
JOIN contractors c ON c.user_id = cq.contractor_id
JOIN quote_requests qr ON qr.id = cq.project_id
WHERE c.company_name LIKE '%Micks%'
  AND cq.status = 'accepted'
ORDER BY qr.updated_at DESC;
