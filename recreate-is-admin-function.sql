-- is_admin RPC 함수 재생성 (더 안전한 버전)
-- Supabase SQL Editor에서 실행

-- 기존 함수 삭제 (있다면)
DROP FUNCTION IF EXISTS is_admin(UUID);

-- 새 함수 생성
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 사용자가 존재하고 user_type이 'admin'인지 확인
  RETURN EXISTS(
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND user_type = 'admin'
  );
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;
