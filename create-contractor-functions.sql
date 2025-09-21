-- =====================================================
-- get_contractor_profile 함수 생성
-- 현재 로그인한 사용자의 contractor 프로필을 조회하는 함수
-- =====================================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS get_contractor_profile(UUID);
DROP FUNCTION IF EXISTS get_contractor_profile();

-- 함수 생성 (매개변수 있는 버전)
CREATE OR REPLACE FUNCTION get_contractor_profile(input_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  insurance_info TEXT,
  specialties JSONB,
  years_experience INTEGER,
  portfolio_count INTEGER,
  rating DECIMAL(3,2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 입력값이 없으면 현재 로그인한 사용자 ID 사용
  target_user_id := COALESCE(input_user_id, auth.uid());
  
  -- contractors 테이블에서 해당 사용자의 프로필 반환
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.phone,
    c.address,
    c.license_number,
    c.insurance_info,
    c.specialties,
    c.years_experience,
    c.portfolio_count,
    c.rating,
    c.status,
    c.created_at,
    c.updated_at
  FROM contractors c
  WHERE c.user_id = target_user_id;
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION get_contractor_profile(UUID) TO anon, authenticated;

-- 코멘트 추가
COMMENT ON FUNCTION get_contractor_profile(UUID) IS '사용자 ID로 contractor 프로필을 조회하는 함수. 매개변수가 없으면 현재 로그인한 사용자의 프로필을 반환';

-- =====================================================
-- 추가 헬퍼 함수들
-- =====================================================

-- 현재 사용자가 contractor인지 확인하는 함수
CREATE OR REPLACE FUNCTION is_contractor(input_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(input_user_id, auth.uid());
  
  RETURN EXISTS (
    SELECT 1 FROM contractors 
    WHERE user_id = target_user_id 
    AND status = 'active'
  );
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION is_contractor(UUID) TO anon, authenticated;

-- contractor ID로 프로필 조회하는 함수
CREATE OR REPLACE FUNCTION get_contractor_by_id(contractor_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  specialties JSONB,
  years_experience INTEGER,
  portfolio_count INTEGER,
  rating DECIMAL(3,2),
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.company_name,
    c.contact_name,
    c.email,
    c.phone,
    c.address,
    c.specialties,
    c.years_experience,
    c.portfolio_count,
    c.rating,
    c.status
  FROM contractors c
  WHERE c.id = contractor_id
  AND c.status = 'active'; -- 활성 상태인 업체만 조회
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION get_contractor_by_id(UUID) TO anon, authenticated;

-- =====================================================
-- 테스트 쿼리
-- =====================================================
-- 아래 쿼리들을 실행하여 함수가 정상 작동하는지 확인

-- 1. 현재 로그인한 사용자의 contractor 프로필 조회
-- SELECT * FROM get_contractor_profile();

-- 2. 특정 사용자의 contractor 프로필 조회 (user_id 필요)
-- SELECT * FROM get_contractor_profile('user-uuid-here');

-- 3. 현재 사용자가 contractor인지 확인
-- SELECT is_contractor();

-- 4. contractor ID로 프로필 조회
-- SELECT * FROM get_contractor_by_id('contractor-uuid-here');

-- =====================================================
-- 확인 쿼리
-- =====================================================

-- 함수 목록 확인
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname IN ('get_contractor_profile', 'is_contractor', 'get_contractor_by_id')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- contractors 테이블 확인
SELECT 
  COUNT(*) as total_contractors,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contractors
FROM contractors;
