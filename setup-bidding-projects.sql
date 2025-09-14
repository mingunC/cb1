-- bidding 상태인 프로젝트 확인 및 생성

-- 1. 현재 모든 프로젝트 상태 확인
SELECT id, customer_id, space_type, status, created_at 
FROM public.quote_requests 
ORDER BY created_at DESC;

-- 2. bidding 상태인 프로젝트가 없다면 테스트용 프로젝트를 bidding 상태로 변경
-- (기존 프로젝트가 있다면 그 중 하나를 선택)
UPDATE public.quote_requests 
SET status = 'bidding'
WHERE id = (
  SELECT id FROM public.quote_requests 
  WHERE status IN ('approved', 'site-visit-completed')
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. 변경 결과 확인
SELECT id, customer_id, space_type, status, created_at 
FROM public.quote_requests 
WHERE status = 'bidding'
ORDER BY created_at DESC;

-- 4. micks1@me.com 사용자 정보 확인
SELECT id, email, user_type, first_name, last_name 
FROM public.users 
WHERE email = 'micks1@me.com';
