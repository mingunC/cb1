-- ============================================
-- Contractors와 Users 자동 연결 스크립트
-- ============================================
-- Google OAuth 로그인 시 contractors 테이블과 users 테이블을 자동으로 연결합니다.

-- 1. contractors 테이블에 email 컬럼이 없다면 확인
-- (이미 있다면 이 부분은 무시됩니다)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contractors' AND column_name = 'email'
    ) THEN
        RAISE NOTICE 'email 컬럼이 contractors 테이블에 없습니다. 추가가 필요할 수 있습니다.';
    END IF;
END $$;

-- 2. 기존 contractors의 user_id를 이메일 기반으로 연결
-- contractors.email과 users.email이 일치하면 user_id 업데이트
UPDATE contractors c
SET user_id = u.id
FROM users u
WHERE c.email = u.email
  AND c.user_id IS NULL;

-- 3. contractors 자동 연결 함수 생성
-- Google OAuth 로그인 시 이메일로 contractor를 찾아 자동 연결
CREATE OR REPLACE FUNCTION auto_link_contractor_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 새로 생성된 user의 이메일로 contractor 찾기
  UPDATE contractors
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  
  -- contractor가 연결되었는지 로그 출력
  IF FOUND THEN
    RAISE NOTICE 'Contractor automatically linked to user: %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto_link_contractor_to_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. users 테이블에 트리거 추가
DROP TRIGGER IF EXISTS on_user_created_link_contractor ON users;
CREATE TRIGGER on_user_created_link_contractor
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_contractor_to_user();

-- 5. 기존 연결 안 된 contractors와 users를 다시 한 번 연결
DO $$
DECLARE
  linked_count INTEGER;
BEGIN
  UPDATE contractors c
  SET user_id = u.id
  FROM users u
  WHERE c.email = u.email
    AND c.user_id IS NULL;
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RAISE NOTICE '✅ % contractor(s) linked to users', linked_count;
END $$;

-- 6. 연결 상태 확인 쿼리
SELECT 
  c.id as contractor_id,
  c.company_name,
  c.email as contractor_email,
  c.user_id,
  u.email as user_email,
  CASE 
    WHEN c.user_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not Linked'
  END as link_status
FROM contractors c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY link_status, c.company_name;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Contractors와 Users 자동 연결 설정이 완료되었습니다.';
  RAISE NOTICE '이제 파트너사가 Google로 로그인하면 자동으로 연결됩니다.';
END $$;
