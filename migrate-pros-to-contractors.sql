-- =====================================================
-- 테이블 이름 통일: pros → contractors
-- 이 스크립트를 실행하여 기존 pros 테이블을 contractors로 마이그레이션
-- =====================================================

-- 1. 기존 contractors 테이블이 있고 pros 테이블이 없는 경우
-- (이미 contractors를 사용 중인 경우 - 아무 작업 필요 없음)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractors') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pros') THEN
        RAISE NOTICE 'contractors 테이블이 이미 존재하고 pros 테이블이 없습니다. 마이그레이션 불필요.';
        RETURN;
    END IF;
END $$;

-- 2. pros 테이블만 있는 경우 - contractors로 이름 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pros') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractors') THEN
        
        -- 테이블 이름 변경
        ALTER TABLE pros RENAME TO contractors;
        
        -- 인덱스 이름 변경
        ALTER INDEX IF EXISTS idx_pros_user_id RENAME TO idx_contractors_user_id;
        ALTER INDEX IF EXISTS idx_pros_is_verified RENAME TO idx_contractors_is_verified;
        ALTER INDEX IF EXISTS idx_pros_is_active RENAME TO idx_contractors_is_active;
        ALTER INDEX IF EXISTS idx_pros_service_areas RENAME TO idx_contractors_service_areas;
        ALTER INDEX IF EXISTS idx_pros_specialties RENAME TO idx_contractors_specialties;
        
        -- 트리거 이름 변경
        ALTER TRIGGER IF EXISTS update_pros_updated_at ON contractors 
            RENAME TO update_contractors_updated_at;
        
        RAISE NOTICE 'pros 테이블을 contractors로 성공적으로 변경했습니다.';
    END IF;
END $$;

-- 3. 두 테이블이 모두 있는 경우 - 데이터 병합
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pros') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractors') THEN
        
        -- pros 테이블의 데이터를 contractors로 마이그레이션
        INSERT INTO contractors (
            user_id,
            company_name,
            contact_name,
            email,
            phone,
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
        )
        SELECT 
            user_id,
            COALESCE(business_name, company_name, 'Unknown Company'),
            contact_name,
            email,
            phone,
            address,
            license_number,
            insurance_info,
            specialties,
            years_experience,
            0 as portfolio_count,
            rating,
            CASE 
                WHEN is_active = true THEN 'active'
                ELSE 'inactive'
            END as status,
            created_at,
            updated_at
        FROM pros
        WHERE NOT EXISTS (
            SELECT 1 FROM contractors c 
            WHERE c.user_id = pros.user_id
        );
        
        -- pros 테이블 삭제
        DROP TABLE pros CASCADE;
        
        RAISE NOTICE 'pros 테이블 데이터를 contractors로 병합했습니다.';
    END IF;
END $$;

-- 4. get_contractor_profile 함수 업데이트
CREATE OR REPLACE FUNCTION get_contractor_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.company_name,
    c.contact_name,
    c.email,
    c.phone,
    c.status
  FROM contractors c
  WHERE c.user_id = get_contractor_profile.user_id;
END;
$$;

-- 5. portfolios 테이블의 외래키 업데이트 (pros_id → contractor_id)
DO $$ 
BEGIN
    -- 컬럼이 pros_id인 경우 contractor_id로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portfolios' AND column_name = 'pros_id'
    ) THEN
        ALTER TABLE portfolios RENAME COLUMN pros_id TO contractor_id;
    END IF;
    
    -- 외래키 제약조건 재생성
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'portfolios' 
        AND constraint_name = 'portfolios_pros_id_fkey'
    ) THEN
        ALTER TABLE portfolios DROP CONSTRAINT portfolios_pros_id_fkey;
    END IF;
    
    -- 새 외래키 추가 (contractors 테이블 참조)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'portfolios' 
        AND constraint_name = 'portfolios_contractor_id_fkey'
    ) THEN
        ALTER TABLE portfolios 
        ADD CONSTRAINT portfolios_contractor_id_fkey 
        FOREIGN KEY (contractor_id) 
        REFERENCES contractors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. RLS 정책 업데이트
-- 기존 pros 관련 정책 삭제 및 contractors 정책으로 재생성
DO $$ 
BEGIN
    -- portfolios 테이블의 RLS 정책 업데이트
    DROP POLICY IF EXISTS "Contractors can manage their own portfolios" ON portfolios;
    
    CREATE POLICY "Contractors can manage their own portfolios" ON portfolios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM contractors 
            WHERE id = contractor_id AND user_id = auth.uid()
        )
    );
END $$;

-- 7. 확인
SELECT 
    'contractors' as table_name,
    COUNT(*) as record_count
FROM contractors
UNION ALL
SELECT 
    'portfolios' as table_name,
    COUNT(*) as record_count  
FROM portfolios;

-- 완료 메시지
DO $$ 
BEGIN
    RAISE NOTICE '================================';
    RAISE NOTICE '마이그레이션 완료!';
    RAISE NOTICE '모든 테이블이 contractors로 통일되었습니다.';
    RAISE NOTICE '================================';
END $$;
