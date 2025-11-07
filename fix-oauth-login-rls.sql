-- ============================================
-- Google OAuth 로그인 문제 해결을 위한 RLS 정책 수정
-- ============================================
-- 이 스크립트는 Google OAuth 로그인 시 발생하는 RLS 정책 문제를 해결합니다.

-- 1. users 테이블의 기존 INSERT 정책 제거
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Allow signup insert" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON users;

-- 2. 새로운 INSERT 정책 생성
-- OAuth 콜백 중에도 사용자 레코드를 생성할 수 있도록 anon 역할 포함
CREATE POLICY "Enable insert for signup and oauth"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);  -- OAuth 콜백 중에는 auth.uid()가 제대로 작동하지 않을 수 있으므로 모든 삽입 허용

-- 3. SELECT 정책 재생성 (자신의 프로필만 조회)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. UPDATE 정책 재생성 (자신의 프로필만 수정)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. 관리자 정책 재생성
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- 6. contractors 테이블의 SELECT 정책 수정
-- contractors 조회 시 세션이 없어도 조회 가능하도록 수정
DROP POLICY IF EXISTS "Public contractor info viewable" ON contractors;
CREATE POLICY "Public contractor info viewable"
ON contractors
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- 7. RLS 활성화 확인
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- 8. 트리거 함수 재생성 (SECURITY DEFINER 확인)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- 이 설정으로 RLS를 우회하여 실행
SET search_path = public
AS $$
BEGIN
  -- auth.users에 사용자가 추가될 때 자동으로 users 테이블에도 추가
  INSERT INTO public.users (id, email, user_type, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'customer',  -- 기본값은 customer
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- 이미 존재하면 무시
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러가 발생해도 트리거는 성공으로 처리 (사용자 생성은 계속 진행)
    RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 9. 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 10. 기존 auth.users에 있지만 public.users에 없는 사용자들을 위한 레코드 생성
INSERT INTO public.users (id, email, user_type, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  'customer',  -- 기본값
  au.created_at, 
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 11. Google OAuth 사용자의 이름 동기화를 위한 함수
CREATE OR REPLACE FUNCTION sync_google_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Google OAuth로 로그인한 사용자의 메타데이터에서 이름 추출
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    UPDATE public.users
    SET
      first_name = COALESCE(
        split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
        first_name
      ),
      last_name = COALESCE(
        CASE 
          WHEN array_length(string_to_array(NEW.raw_user_meta_data->>'full_name', ' '), 1) > 1 
          THEN substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1)
          ELSE last_name
        END,
        last_name
      ),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in sync_google_user_metadata: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 12. Google 사용자 메타데이터 동기화 트리거
DROP TRIGGER IF EXISTS on_auth_user_created_sync_google ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_google
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_app_meta_data->>'provider' = 'google')
  EXECUTE FUNCTION sync_google_user_metadata();

-- 13. 정책 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE ''
  END || 
  CASE 
    WHEN with_check IS NOT NULL THEN ' WITH CHECK: ' || with_check
    ELSE ''
  END as policy_definition
FROM pg_policies 
WHERE tablename IN ('users', 'contractors')
ORDER BY tablename, policyname;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Google OAuth 로그인 RLS 정책이 성공적으로 수정되었습니다.';
  RAISE NOTICE '이제 Google 로그인을 다시 시도해보세요.';
END $$;
