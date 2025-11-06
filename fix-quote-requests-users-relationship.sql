-- quote_requests 테이블과 users 테이블 간의 외래 키 관계 추가
-- 관리자 대시보드에서 고객 정보(이메일, 이름)를 조회하기 위해 필요

-- 1. 기존 외래 키 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='quote_requests';

-- 2. 기존 외래 키가 auth.users를 참조하는 경우 삭제
-- (users 테이블을 참조하도록 변경하기 위함)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'quote_requests_customer_id_fkey'
        AND table_name = 'quote_requests'
    ) THEN
        ALTER TABLE quote_requests 
        DROP CONSTRAINT quote_requests_customer_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- 3. users 테이블이 존재하는지 확인
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- 4. 새로운 외래 키 제약 조건 추가
-- customer_id가 users 테이블의 id를 참조하도록 설정
ALTER TABLE quote_requests
ADD CONSTRAINT quote_requests_customer_id_fkey
FOREIGN KEY (customer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 5. 인덱스 생성 (이미 있을 수 있음)
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id 
ON quote_requests(customer_id);

-- 6. 결과 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='quote_requests'
    AND kcu.column_name='customer_id';

-- 완료 메시지
SELECT 'Foreign key relationship added successfully between quote_requests and users' as status;
