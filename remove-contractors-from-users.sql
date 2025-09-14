-- contractors 테이블에 있는 사용자들을 users 테이블에서 제거
-- 업체는 contractors 테이블에만 데이터가 있어야 함

DELETE FROM users 
WHERE id IN (
    SELECT user_id 
    FROM contractors 
    WHERE user_id IS NOT NULL
);

-- 결과 확인: contractors 테이블에 있는 사용자들
SELECT 
    c.id as contractor_id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status
FROM contractors c
ORDER BY c.created_at DESC;

-- users 테이블에 남아있는 사용자들 (일반 고객과 관리자만)
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.first_name,
    u.last_name
FROM users u
ORDER BY u.created_at DESC;
