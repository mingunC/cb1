-- 기존 업체 사용자들의 user_type을 'contractor'로 수정
-- contractors 테이블에 있는 사용자들을 찾아서 users 테이블의 user_type을 업데이트

UPDATE users 
SET user_type = 'contractor',
    updated_at = NOW()
WHERE id IN (
    SELECT user_id 
    FROM contractors 
    WHERE user_id IS NOT NULL
);

-- 결과 확인
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.first_name,
    u.last_name,
    c.company_name,
    c.contact_name
FROM users u
LEFT JOIN contractors c ON u.id = c.user_id
WHERE u.user_type = 'contractor'
ORDER BY u.created_at DESC;
