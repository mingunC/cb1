-- users 테이블의 user_type 체크 제약조건 확인 및 수정

-- 1. 현재 제약조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
  AND contype = 'c'
  AND conname LIKE '%user_type%';

-- 2. 기존 제약조건 삭제 (이름이 다를 수 있음)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_user_type;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_check;

-- 3. 새로운 제약조건 추가 (customer, contractor, admin 허용)
ALTER TABLE public.users 
ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('customer', 'contractor', 'admin'));

-- 4. 제약조건 확인
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
  AND contype = 'c'
  AND conname LIKE '%user_type%';

-- 5. micks1@me.com을 contractor로 변경
UPDATE public.users 
SET user_type = 'contractor'
WHERE email = 'micks1@me.com';

-- 6. 변경 결과 확인
SELECT id, email, user_type FROM public.users WHERE email = 'micks1@me.com';
