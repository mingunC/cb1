-- 업체 사용자 중복 정리: users 테이블에서 업체 제거

-- 1. 현재 상황 확인
SELECT 
    'users' as table_name,
    id,
    email,
    user_type,
    first_name,
    last_name
FROM public.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'contractors' as table_name,
    c.id::text,
    c.email,
    'contractor' as user_type,
    c.company_name as first_name,
    c.contact_name as last_name
FROM public.contractors c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';

-- 2. contractors 테이블에 있는 업체들의 user_id 확인
SELECT 
    c.id as contractor_id,
    c.user_id,
    c.company_name,
    c.email,
    u.email as user_email,
    u.user_type
FROM public.contractors c
LEFT JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';

-- 3. users 테이블에서 업체 사용자 삭제 (contractors 테이블에 있는 경우)
DELETE FROM public.users 
WHERE email = 'micks1@me.com' 
AND user_type = 'contractor'
AND id IN (
    SELECT user_id FROM public.contractors WHERE email = 'micks1@me.com'
);

-- 4. 삭제 후 확인
SELECT 
    'users' as table_name,
    id,
    email,
    user_type,
    first_name,
    last_name
FROM public.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'contractors' as table_name,
    c.id::text,
    c.email,
    'contractor' as user_type,
    c.company_name as first_name,
    c.contact_name as last_name
FROM public.contractors c
WHERE c.email = 'micks1@me.com';
