-- contractors 테이블 데이터 확인 및 수정

-- 1. contractors 테이블의 모든 데이터 확인
SELECT 
    id,
    user_id,
    company_name,
    contact_name,
    email,
    status
FROM public.contractors;

-- 2. micks1@me.com의 auth.users ID 확인
SELECT 
    id,
    email
FROM auth.users 
WHERE email = 'micks1@me.com';

-- 3. contractors 테이블에 올바른 user_id로 데이터 삽입/업데이트
-- 먼저 기존 데이터 삭제
DELETE FROM public.contractors 
WHERE email = 'micks1@me.com';

-- 새로운 데이터 삽입 (올바른 user_id 사용)
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
) VALUES (
    'adecb6f4-45f5-445c-ab54-c2bc1b7cfead', -- micks1@me.com의 auth.users ID
    'Micks Construction Co.',
    'Mick Smith',
    NULL,
    'micks1@me.com',
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
);

-- 4. 최종 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    u.email as auth_email
FROM public.contractors c
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.email = 'micks1@me.com';
