-- users 테이블에 preferred_language 컬럼 추가
-- 고객의 선호 언어를 저장하여 이메일 등에서 활용

-- 1. preferred_language 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 2. 기존 사용자들의 기본값 설정
UPDATE users 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;

-- 3. 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);

-- 4. 사용자 프로필 자동 생성 함수 업데이트 (preferred_language 포함)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    first_name,
    last_name,
    phone,
    preferred_language,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    NOW(), 
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 5. 트리거 재생성: 새 사용자 가입 시 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 확인
SELECT 
  id,
  email,
  first_name,
  preferred_language
FROM users
LIMIT 5;
