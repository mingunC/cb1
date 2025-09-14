-- 회원가입 로직 정리: 고객은 users 테이블, 업체는 contractors 테이블

-- 1. 기존 잘못 저장된 데이터 정리
-- contractors 테이블에 있는 사용자들을 users 테이블에서 제거
DELETE FROM users 
WHERE id IN (
    SELECT user_id 
    FROM contractors 
    WHERE user_id IS NOT NULL
);

-- 2. 결과 확인
-- contractors 테이블에 있는 업체들
SELECT 
    c.id as contractor_id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    c.created_at
FROM contractors c
ORDER BY c.created_at DESC;

-- users 테이블에 있는 고객들 (일반 고객과 관리자만)
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.first_name,
    u.last_name,
    u.created_at
FROM users u
ORDER BY u.created_at DESC;

-- 3. 인증 테이블과의 연결 확인
-- auth.users와 contractors 연결 확인
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    c.company_name,
    c.contact_name,
    c.status
FROM auth.users au
LEFT JOIN contractors c ON au.id = c.user_id
WHERE c.user_id IS NOT NULL
ORDER BY au.created_at DESC;

-- auth.users와 users 연결 확인
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.user_type,
    u.first_name,
    u.last_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NOT NULL
ORDER BY au.created_at DESC;
