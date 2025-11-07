-- ============================================
-- Google OAuth 파트너사 로그인 완전 해결 스크립트
-- ============================================
-- 이 스크립트는 다음을 모두 해결합니다:
-- 1. RLS 정책 문제
-- 2. first_name/last_name NOT NULL 제약조건
-- 3. contractors와 users 자동 연결
-- ============================================

-- ============================================
-- PART 1: RLS 정책 및 제약조건 수정
-- ============================================

-- 1-1. users 테이블의 NOT NULL 제약조건 제거
ALTER TABLE users 
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL;

-- 1-2. users 테이블의 기존 INSERT 정책 제거
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable insert during signup" ON users;
DROP POLICY IF EXISTS "Allow signup insert" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON users;
DROP POLICY IF EXISTS "Enable insert for signup and oauth" ON users;

-- 1-3. 새로운 INSERT 정책 생성
CREATE POLICY "Enable insert for signup and oauth"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 1-4. SELECT 정책 재생성
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 1-5. UPDATE 정책 재생성
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 1-6. 관리자 정책 재생성
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

-- 1-7. contractors 테이블의 SELECT 정책 수정
DROP POLICY IF EXISTS "Public contractor info viewable" ON contractors;
CREATE POLICY "Public contractor info viewable"
ON contractors
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- 1-8. RLS 활성화 확인
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: 사용자 프로필 생성 트리거 (Google 이름 포함)
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name TEXT;
  name_parts TEXT[];
BEGIN
  -- Google OAuth에서 full_name 추출
  full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- 이름을 공백으로 분리
  IF full_name IS NOT NULL THEN
    name_parts := string_to_array(full_name, ' ');
  END IF;
  
  -- users 테이블에 사용자 추가
  INSERT INTO public.users (
    id, 
    email, 
    user_type, 
    first_name, 
    last_name,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    'customer',
    COALESCE(name_parts[1], ''),
    COALESCE(array_to_string(name_parts[2:array_length(name_parts, 1)], ' '), ''),
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, users.first_name, ''),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name, ''),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================
-- PART 3: Contractors와 Users 자동 연결
-- ============================================

-- 3-1. contractors 자동 연결 함수 생성
CREATE OR REPLACE FUNCTION auto_link_contractor_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contractor_id UUID;
BEGIN
  -- 새로 생성된 user의 이메일로 contractor 찾기
  UPDATE contractors
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND (user_id IS NULL OR user_id != NEW.id)
  RETURNING id INTO contractor_id;
  
  -- contractor가 연결되었는지 로그 출력
  IF FOUND THEN
    RAISE NOTICE '✅ Contractor (%) automatically linked to user: %', contractor_id, NEW.email;
    
    -- users 테이블의 user_type도 contractor로 업데이트
    UPDATE users
    SET user_type = 'contractor',
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE '✅ User type updated to contractor for: %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto_link_contractor_to_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3-2. users 테이블에 트리거 추가
DROP TRIGGER IF EXISTS on_user_created_link_contractor ON users;
CREATE TRIGGER on_user_created_link_contractor
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_contractor_to_user();

-- ============================================
-- PART 4: 기존 데이터 정리 및 연결
-- ============================================

-- 4-1. 기존 NULL 값을 빈 문자열로 업데이트
UPDATE users 
SET 
  first_name = COALESCE(first_name, ''),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL OR last_name IS NULL;

-- 4-2. 기존 auth.users에 있지만 public.users에 없는 사용자 추가
INSERT INTO public.users (id, email, user_type, first_name, last_name, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  'customer',
  COALESCE(split_part(au.raw_user_meta_data->>'full_name', ' ', 1), ''),
  COALESCE(
    CASE 
      WHEN array_length(string_to_array(au.raw_user_meta_data->>'full_name', ' '), 1) > 1 
      THEN substring(au.raw_user_meta_data->>'full_name' from position(' ' in au.raw_user_meta_data->>'full_name') + 1)
      ELSE ''
    END,
    ''
  ),
  au.created_at, 
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  first_name = COALESCE(EXCLUDED.first_name, users.first_name, ''),
  last_name = COALESCE(EXCLUDED.last_name, users.last_name, ''),
  updated_at = NOW();

-- 4-3. 기존 contractors와 users를 이메일로 연결
DO $$
DECLARE
  linked_count INTEGER := 0;
  contractor_rec RECORD;
BEGIN
  FOR contractor_rec IN 
    SELECT c.id, c.email, u.id as user_id
    FROM contractors c
    INNER JOIN users u ON c.email = u.email
    WHERE c.user_id IS NULL OR c.user_id != u.id
  LOOP
    UPDATE contractors
    SET user_id = contractor_rec.user_id,
        updated_at = NOW()
    WHERE id = contractor_rec.id;
    
    -- user_type도 contractor로 업데이트
    UPDATE users
    SET user_type = 'contractor',
        updated_at = NOW()
    WHERE id = contractor_rec.user_id
      AND user_type != 'contractor';
    
    linked_count := linked_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ % contractor(s) linked to users', linked_count;
END $$;

-- ============================================
-- PART 5: 검증 및 결과 확인
-- ============================================

-- 5-1. RLS 정책 확인
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS 정책 확인:';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename IN ('users', 'contractors')
ORDER BY tablename, policyname;

-- 5-2. Contractors 연결 상태 확인
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contractors 연결 상태:';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  c.id as contractor_id,
  c.company_name,
  c.email as contractor_email,
  c.user_id,
  u.email as user_email,
  u.user_type,
  CASE 
    WHEN c.user_id IS NOT NULL AND u.user_type = 'contractor' THEN '✅ Linked & Correct Type'
    WHEN c.user_id IS NOT NULL AND u.user_type != 'contractor' THEN '⚠️ Linked but Wrong Type'
    ELSE '❌ Not Linked'
  END as link_status
FROM contractors c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY link_status, c.company_name;

-- 5-3. 제약조건 확인
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users 테이블 제약조건:';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('first_name', 'last_name', 'email');

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 모든 설정이 완료되었습니다!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '다음 사항들이 해결되었습니다:';
  RAISE NOTICE '1. ✅ RLS 정책 수정 (OAuth 로그인 허용)';
  RAISE NOTICE '2. ✅ first_name/last_name nullable 변경';
  RAISE NOTICE '3. ✅ Contractors와 Users 자동 연결';
  RAISE NOTICE '4. ✅ Google OAuth 이름 자동 추출';
  RAISE NOTICE '';
  RAISE NOTICE '이제 파트너사가 Google로 로그인하면:';
  RAISE NOTICE '- auth.users에 계정 생성';
  RAISE NOTICE '- users 테이블에 프로필 생성';
  RAISE NOTICE '- contractors 테이블과 자동 연결';
  RAISE NOTICE '- user_type이 contractor로 자동 설정';
  RAISE NOTICE '- /contractor 대시보드로 리다이렉트';
  RAISE NOTICE '';
  RAISE NOTICE '테스트 방법:';
  RAISE NOTICE '1. 브라우저 캐시/쿠키 삭제';
  RAISE NOTICE '2. /contractor-login 페이지 방문';
  RAISE NOTICE '3. "Sign in with Google" 클릭';
  RAISE NOTICE '4. 파트너사 Google 계정으로 로그인';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
