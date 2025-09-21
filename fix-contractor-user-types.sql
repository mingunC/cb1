-- 업체 로그인 문제 해결: users 테이블의 user_type 수정
-- contractors 테이블에 등록된 사용자들의 user_type을 'contractor'로 설정

-- 현재 상태 확인
SELECT 
    u.id,
    u.email,
    u.user_type as current_user_type,
    c.company_name,
    c.status
FROM auth.users u
JOIN public.contractors c ON u.id = c.user_id
ORDER BY c.company_name;

-- contractors 테이블에 등록된 모든 사용자의 user_type을 'contractor'로 업데이트
UPDATE public.users 
SET user_type = 'contractor'
WHERE id IN (
    SELECT user_id 
    FROM public.contractors 
    WHERE status = 'active'
);

-- 업데이트 결과 확인
SELECT 
    u.id,
    u.email,
    u.user_type as updated_user_type,
    c.company_name,
    c.status
FROM public.users u
JOIN public.contractors c ON u.id = c.user_id
ORDER BY c.company_name;

-- 특정 업체 계정 확인 (micks1@me.com)
SELECT 
    u.email,
    u.user_type,
    c.company_name,
    c.status
FROM public.users u
JOIN public.contractors c ON u.id = c.user_id
WHERE u.email = 'micks1@me.com';

-- 특정 업체 계정 확인 (mgc202077@gmail.com)
SELECT 
    u.email,
    u.user_type,
    c.company_name,
    c.status
FROM public.users u
JOIN public.contractors c ON u.id = c.user_id
WHERE u.email = 'mgc202077@gmail.com';
