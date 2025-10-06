-- 즉시 실행할 SQL: company_logo 컬럼 추가
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS company_logo TEXT;
