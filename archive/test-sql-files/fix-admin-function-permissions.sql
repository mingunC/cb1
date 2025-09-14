-- is_admin 함수 권한 재설정
-- Supabase SQL Editor에서 실행

-- 함수 권한 확인
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'is_admin';

-- 권한 재설정
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO service_role;

-- 함수 다시 생성 (더 안전하게)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND user_type = 'admin'
  );
END;
$$;
