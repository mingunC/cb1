-- 업체 사용자 중복 정리 (안전한 방법)

-- 1. 현재 상황 확인
SELECT 
    'auth.users' as table_name,
    id,
    email,
    'auth' as source
FROM auth.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'public.users' as table_name,
    id,
    email,
    user_type as source
FROM public.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'public.contractors' as table_name,
    id::text,
    email,
    'contractor' as source
FROM public.contractors 
WHERE email = 'micks1@me.com';

-- 2. 올바른 구조로 정리
-- public.users에서 업체 정보 제거하고 contractors 테이블만 사용
-- 하지만 auth.users는 유지해야 함

-- 3. public.users에서 업체 관련 필드만 NULL로 설정
UPDATE public.users 
SET 
    first_name = NULL,
    last_name = NULL,
    user_type = 'contractor'  -- 타입은 유지하되 이름 정보는 제거
WHERE email = 'micks1@me.com' 
AND user_type = 'contractor';

-- 4. contractors 테이블에 업체명 설정
UPDATE public.contractors 
SET 
    company_name = 'Micks Construction Co.',
    contact_name = 'Mick Smith'
WHERE email = 'micks1@me.com';

-- 5. 최종 확인
SELECT 
    'auth.users' as table_name,
    id,
    email,
    'auth' as source
FROM auth.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'public.users' as table_name,
    id,
    email,
    user_type as source
FROM public.users 
WHERE email = 'micks1@me.com'

UNION ALL

SELECT 
    'public.contractors' as table_name,
    id::text,
    email,
    'contractor' as source
FROM public.contractors 
WHERE email = 'micks1@me.com';
