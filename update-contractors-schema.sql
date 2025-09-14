-- contractors 테이블 스키마 수정: first_name, last_name 제거

-- 1. contractors 테이블에서 first_name, last_name 컬럼 삭제
ALTER TABLE public.contractors DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.contractors DROP COLUMN IF EXISTS last_name;

-- 2. contact_name을 더 명확하게 변경 (선택사항)
-- ALTER TABLE public.contractors RENAME COLUMN contact_name TO contact_person;

-- 3. 수정된 contractors 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contractors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 기존 데이터 확인 (first_name, last_name이 제거되었는지)
SELECT 
    id,
    company_name,
    contact_name,
    email,
    status
FROM public.contractors 
LIMIT 5;
