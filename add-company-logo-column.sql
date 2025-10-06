-- contractors 테이블에 company_logo 컬럼 추가
-- 회사 로고 이미지 URL을 저장하기 위한 컬럼

-- 1. contractors 테이블에 company_logo 컬럼 추가
ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 2. 컬럼이 제대로 추가되었는지 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
AND column_name = 'company_logo';

-- 3. contractors 테이블의 전체 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 기존 contractors 데이터 확인 (company_logo 컬럼 포함)
SELECT 
    id,
    company_name,
    company_logo,
    email,
    phone,
    created_at
FROM public.contractors 
LIMIT 5;

-- 5. RLS 정책 확인 (company_logo 컬럼도 포함되어야 함)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contractors';
