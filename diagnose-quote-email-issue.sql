-- 견적서 제출 시 이메일 발송 문제 진단 쿼리

-- 1. 최근 제출된 견적서 확인
SELECT 
  cq.id as quote_id,
  cq.project_id,
  cq.contractor_id,
  cq.price,
  cq.status,
  cq.created_at,
  c.company_name as contractor_name,
  c.email as contractor_email
FROM contractor_quotes cq
LEFT JOIN contractors c ON cq.contractor_id = c.id
ORDER BY cq.created_at DESC
LIMIT 10;

-- 2. 프로젝트와 고객 정보 확인
SELECT 
  qr.id as project_id,
  qr.customer_id,
  qr.status as project_status,
  qr.full_address,
  qr.space_type,
  qr.budget,
  u.email as customer_email,
  u.phone as customer_phone,
  u.user_type,
  CASE 
    WHEN u.email IS NULL THEN '❌ 고객 이메일 없음'
    WHEN u.email = '' THEN '❌ 고객 이메일 빈 문자열'
    ELSE '✅ 고객 이메일 있음'
  END as email_status
FROM quote_requests qr
LEFT JOIN users u ON qr.customer_id = u.id
WHERE qr.status = 'bidding'
ORDER BY qr.created_at DESC;

-- 3. 특정 프로젝트의 견적서와 고객 이메일 연결 확인
-- (최근 프로젝트 ID를 여기에 입력하세요)
SELECT 
  qr.id as project_id,
  qr.customer_id,
  u.email as customer_email,
  u.phone as customer_phone,
  u.user_type,
  c.company_name as contractor_name,
  c.email as contractor_email,
  cq.price,
  cq.created_at as quote_submitted_at
FROM quote_requests qr
LEFT JOIN users u ON qr.customer_id = u.id
LEFT JOIN contractor_quotes cq ON cq.project_id = qr.id
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE qr.status = 'bidding'
ORDER BY cq.created_at DESC
LIMIT 10;

-- 4. 고객 이메일이 없는 프로젝트 찾기
SELECT 
  qr.id as project_id,
  qr.customer_id,
  qr.status,
  qr.created_at,
  u.email as customer_email,
  CASE 
    WHEN qr.customer_id IS NULL THEN '❌ customer_id가 NULL'
    WHEN u.id IS NULL THEN '❌ users 테이블에 고객이 없음'
    WHEN u.email IS NULL THEN '❌ 이메일이 NULL'
    WHEN u.email = '' THEN '❌ 이메일이 빈 문자열'
    ELSE '✅ 정상'
  END as issue
FROM quote_requests qr
LEFT JOIN users u ON qr.customer_id = u.id
WHERE qr.status = 'bidding'
  AND (
    qr.customer_id IS NULL 
    OR u.id IS NULL 
    OR u.email IS NULL 
    OR u.email = ''
  )
ORDER BY qr.created_at DESC;

-- 5. 견적서는 있지만 고객 이메일이 없는 케이스
SELECT 
  cq.id as quote_id,
  cq.project_id,
  qr.customer_id,
  u.email as customer_email,
  c.company_name as contractor_name,
  cq.price,
  cq.created_at
FROM contractor_quotes cq
LEFT JOIN quote_requests qr ON cq.project_id = qr.id
LEFT JOIN users u ON qr.customer_id = u.id
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE u.email IS NULL OR u.email = ''
ORDER BY cq.created_at DESC
LIMIT 10;
