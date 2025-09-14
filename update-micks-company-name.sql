-- micks1@me.com의 업체 정보 확인 및 업체명 수정

-- 1. contractors 테이블에서 micks1@me.com의 데이터 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.status,
    u.email,
    u.user_type
FROM public.contractors c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';

-- 2. 업체명을 더 의미있게 변경
UPDATE public.contractors 
SET company_name = 'Micks Construction Co.'
WHERE user_id = (
    SELECT id FROM public.users WHERE email = 'micks1@me.com'
);

-- 3. 담당자명도 수정
UPDATE public.contractors 
SET contact_name = 'Mick Smith'
WHERE user_id = (
    SELECT id FROM public.users WHERE email = 'micks1@me.com'
);

-- 4. 최종 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.status,
    u.email,
    u.user_type
FROM public.contractors c
JOIN public.users u ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';
