-- contractor_quotes 테이블 외래키 수정
-- contractor_id가 contractors 테이블의 id를 참조하도록 변경

-- 1. 현재 contractor_quotes 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contractor_quotes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 현재 외래키 제약조건 확인
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'contractor_quotes';

-- 3. 기존 contractor_quotes 데이터 확인
SELECT 
  cq.id,
  cq.project_id,
  cq.contractor_id,
  cq.bid_amount,
  cq.status,
  u.email as contractor_email
FROM public.contractor_quotes cq
LEFT JOIN public.users u ON u.id = cq.contractor_id
ORDER BY cq.created_at DESC;

-- 4. contractor_id를 contractors 테이블의 id로 매핑
-- 먼저 새로운 컬럼 추가
ALTER TABLE public.contractor_quotes 
ADD COLUMN contractor_contractor_id UUID;

-- 5. 기존 데이터를 contractors 테이블의 id로 업데이트
UPDATE public.contractor_quotes 
SET contractor_contractor_id = c.id
FROM public.contractors c
WHERE public.contractor_quotes.contractor_id = c.user_id;

-- 6. 업데이트 결과 확인
SELECT 
  cq.id,
  cq.contractor_id as old_user_id,
  cq.contractor_contractor_id as new_contractor_id,
  c.company_name,
  u.email
FROM public.contractor_quotes cq
LEFT JOIN public.contractors c ON c.id = cq.contractor_contractor_id
LEFT JOIN public.users u ON u.id = cq.contractor_id
ORDER BY cq.created_at DESC;

-- 7. 기존 contractor_id 컬럼 삭제 및 새 컬럼으로 교체
-- (이 단계는 데이터 확인 후 실행)
-- ALTER TABLE public.contractor_quotes DROP COLUMN contractor_id;
-- ALTER TABLE public.contractor_quotes RENAME COLUMN contractor_contractor_id TO contractor_id;

-- 8. 새로운 외래키 제약조건 추가
-- ALTER TABLE public.contractor_quotes 
-- ADD CONSTRAINT fk_contractor_quotes_contractor_id 
-- FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;
