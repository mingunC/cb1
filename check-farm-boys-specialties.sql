-- Farm Boys 업체의 specialties 확인 및 수정

-- 1. Farm Boys 업체 정보 및 specialties 확인
SELECT 
    id,
    company_name,
    specialties,
    pg_typeof(specialties) as data_type,
    specialties::text as specialties_text
FROM contractors
WHERE company_name ILIKE '%Farm Boys%' 
   OR company_name ILIKE '%farm%'
   OR company_name ILIKE '%Peanut%';

-- 2. specialties가 올바른 배열 형태로 저장되도록 수정
UPDATE contractors
SET specialties = '[]'::jsonb
WHERE (company_name ILIKE '%Farm Boys%' OR company_name ILIKE '%farm%' OR company_name ILIKE '%Peanut%')
  AND specialties::text NOT LIKE '[%';

-- 3. 수정 후 확인
SELECT 
    id,
    company_name,
    specialties,
    pg_typeof(specialties) as data_type
FROM contractors
WHERE company_name ILIKE '%Farm Boys%' 
   OR company_name ILIKE '%farm%'
   OR company_name ILIKE '%Peanut%';

