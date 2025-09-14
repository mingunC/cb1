-- contractors 테이블 외래키 제약조건 수정

-- 1. 현재 외래키 제약조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='contractors';

-- 2. 기존 외래키 제약조건 삭제
ALTER TABLE public.contractors DROP CONSTRAINT IF EXISTS contractors_user_id_fkey;

-- 3. auth.users를 참조하는 새로운 외래키 제약조건 생성
ALTER TABLE public.contractors 
ADD CONSTRAINT contractors_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. contractors 테이블에 데이터 삽입
INSERT INTO public.contractors (
    user_id,
    company_name,
    contact_name,
    phone,
    email,
    address,
    license_number,
    insurance_info,
    specialties,
    years_experience,
    portfolio_count,
    rating,
    status,
    created_at,
    updated_at
) VALUES (
    'adecb6f4-45f5-445c-ab54-c2bc1b7cfead', -- micks1@me.com의 auth.users ID
    'Micks Construction Co.',
    'Mick Smith',
    NULL,
    'micks1@me.com',
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    0,
    0,
    0.0,
    'active',
    NOW(),
    NOW()
);

-- 5. 최종 확인
SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.status,
    u.email as auth_email
FROM public.contractors c
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.email = 'micks1@me.com';

-- 6. 외래키 제약조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='contractors';
