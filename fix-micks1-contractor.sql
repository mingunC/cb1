-- micks1@me.com 계정을 contractors 테이블에 등록
-- 1. 먼저 auth.users에서 user_id 확인
SELECT id, email FROM auth.users WHERE email = 'micks1@me.com';

-- 2. contractors 테이블에 등록 (user_id를 위에서 확인한 값으로 변경)
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
    (SELECT id FROM auth.users WHERE email = 'micks1@me.com'), -- 위에서 확인한 user_id
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

-- 3. 등록 확인
SELECT * FROM contractors WHERE email = 'micks1@me.com';
