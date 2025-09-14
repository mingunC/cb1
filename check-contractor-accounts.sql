-- contractors 테이블에 등록된 계정들 확인
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

-- auth.users에서 해당 이메일들 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('micks1@me.com', 'mgc202077@gmail.com')
ORDER BY email;
