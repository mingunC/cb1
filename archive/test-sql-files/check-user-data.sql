-- 현재 users 테이블의 모든 데이터 확인
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC;

-- 최근 회원가입한 사용자 확인
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    phone,
    created_at
FROM users 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
