-- 두 업체 계정을 contractors 테이블에 등록/업데이트
-- 1. micks1@me.com 등록
INSERT INTO contractors (
    user_id,
    company_name,
    contact_name,
    email,
    phone,
    specialties,
    service_areas,
    rating,
    portfolio_count,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'micks1@me.com'),
    'Micks Construction',
    'Mick Smith',
    'micks1@me.com',
    '555-0123',
    '["kitchen", "bathroom", "flooring"]'::json,
    '["Toronto", "GTA"]'::json,
    4.5,
    0,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_name = EXCLUDED.contact_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specialties = EXCLUDED.specialties,
    service_areas = EXCLUDED.service_areas,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 2. mgc202077@gmail.com 등록
INSERT INTO contractors (
    user_id,
    company_name,
    contact_name,
    email,
    phone,
    specialties,
    service_areas,
    rating,
    portfolio_count,
    status,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'mgc202077@gmail.com'),
    'MGC Construction',
    'MGC Manager',
    'mgc202077@gmail.com',
    '555-0456',
    '["kitchen", "bathroom", "full_renovation"]'::json,
    '["Toronto", "GTA", "Mississauga"]'::json,
    4.8,
    0,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_name = EXCLUDED.contact_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    specialties = EXCLUDED.specialties,
    service_areas = EXCLUDED.service_areas,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 3. 등록 확인
SELECT 
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    u.email as auth_email
FROM contractors c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.email IN ('micks1@me.com', 'mgc202077@gmail.com')
ORDER BY c.email;
