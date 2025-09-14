-- is_admin 함수 결과만 확인
-- Supabase SQL Editor에서 실행

-- is_admin 함수 직접 테스트
SELECT is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID) as is_admin_result;

-- 결과가 true인지 false인지 명확히 확인
SELECT 
  CASE 
    WHEN is_admin('52fc3543-4506-442c-b0de-54b3f8a6c133'::UUID) = true 
    THEN 'TRUE - 관리자입니다' 
    ELSE 'FALSE - 관리자가 아닙니다' 
  END as admin_status;