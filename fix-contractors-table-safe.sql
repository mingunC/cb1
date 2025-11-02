-- Fix contractors table schema - Safe version
-- This checks and adds only missing columns

-- 1. Add missing columns (IF NOT EXISTS prevents errors)
ALTER TABLE public.contractors 
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS years_in_business INTEGER;

-- 2. Check current columns
SELECT 
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'contractors' 
AND table_schema = 'public'
ORDER BY ordinal_position;
