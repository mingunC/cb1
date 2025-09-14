-- auth.users와 contractors 테이블 직접 연결 방법

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

-- 2. contractors 테이블을 auth.users와 직접 연결하도록 수정
-- contractors 테이블의 user_id를 auth.users.id와 직접 연결

-- 3. public.users에서 업체 사용자 완전 제거
DELETE FROM public.users 
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
    'public.contractors' as table_name,
    id::text,
    email,
    'contractor' as source
FROM public.contractors 
WHERE email = 'micks1@me.com';

-- 6. contractors 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'contractors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
