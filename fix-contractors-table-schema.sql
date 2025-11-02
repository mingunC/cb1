-- Fix contractors table schema to match profile page code

-- 1. Add missing columns
ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Rename columns to match code
ALTER TABLE public.contractors 
RENAME COLUMN insurance_info TO insurance;

ALTER TABLE public.contractors 
RENAME COLUMN years_experience TO years_in_business;

-- 3. Update comments
COMMENT ON COLUMN public.contractors.company_logo IS '회사 로고 URL';
COMMENT ON COLUMN public.contractors.description IS '회사 설명';
COMMENT ON COLUMN public.contractors.website IS '웹사이트 URL';
COMMENT ON COLUMN public.contractors.insurance IS '보험 정보';
COMMENT ON COLUMN public.contractors.years_in_business IS '사업 경력 (년)';

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
ORDER BY ordinal_position;
