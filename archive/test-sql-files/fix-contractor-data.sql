-- micks1@me.com의 업체 정보 확인 및 수정

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

-- 2. 만약 contractors 테이블에 데이터가 없다면 추가
INSERT INTO public.contractors (
    user_id,
    company_name,
    contact_name,
    phone,
    email,
    address,
    license_number,
    insurance_info,
    specialties,
    years_experience,
    portfolio_count,
    rating,
    status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'User User', -- 기본 회사명
    'User User', -- 연락담당자
    NULL,
    u.email,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    0,
    0,
    0.0,
    'active',
    NOW(),
    NOW()
FROM public.users u
WHERE u.email = 'micks1@me.com'
AND NOT EXISTS (
    SELECT 1 FROM public.contractors c 
    WHERE c.user_id = u.id
);

-- 3. 업체명을 더 의미있게 변경 (선택사항)
UPDATE public.contractors 
SET company_name = 'Micks Construction Co.'
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
