-- mgc202077@gmail.com 사용자를 users에서 contractors로 이동

-- 1. 먼저 해당 사용자 정보 확인
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.first_name,
    u.last_name,
    u.created_at
FROM users u
WHERE u.email = 'mgc202077@gmail.com';

-- 2. contractors 테이블에 이미 있는지 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email
FROM contractors c
WHERE c.email = 'mgc202077@gmail.com';

-- 3. users 테이블에서 contractors 테이블로 데이터 이동
-- 먼저 contractors 테이블에 데이터 삽입
INSERT INTO contractors (
    user_id,
    company_name,
    contact_name,
    email,
    status,
    specialties,
    years_experience,
    portfolio_count,
    rating,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.first_name || ' ' || u.last_name, '업체명') as company_name,
    COALESCE(u.first_name || ' ' || u.last_name, '담당자명') as contact_name,
    u.email,
    'active' as status,
    '[]'::jsonb as specialties,
    0 as years_experience,
    0 as portfolio_count,
    0.0 as rating,
    u.created_at,
    NOW() as updated_at
FROM users u
WHERE u.email = 'mgc202077@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM contractors c WHERE c.user_id = u.id
);

-- 4. users 테이블에서 해당 사용자 삭제
DELETE FROM users 
WHERE email = 'mgc202077@gmail.com';

-- 5. 결과 확인
-- contractors 테이블에서 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    c.created_at
FROM contractors c
WHERE c.email = 'mgc202077@gmail.com';

-- users 테이블에서 삭제 확인
SELECT 
    u.id,
    u.email,
    u.user_type
FROM users u
WHERE u.email = 'mgc202077@gmail.com';

-- auth.users와의 연결 확인
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    c.company_name,
    c.contact_name,
    c.status
FROM auth.users au
LEFT JOIN contractors c ON au.id = c.user_id
WHERE au.email = 'mgc202077@gmail.com';
