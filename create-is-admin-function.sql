-- is_admin RPC 함수 생성
-- Supabase SQL Editor에서 실행

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
