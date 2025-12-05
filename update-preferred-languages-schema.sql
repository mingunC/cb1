-- preferred_language를 preferred_languages 배열로 변경
-- 사용자가 여러 언어를 선택할 수 있도록 지원

-- 1. 새 컬럼 추가 (배열)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_languages TEXT[] DEFAULT ARRAY['en']::TEXT[];

-- 2. 기존 preferred_language 데이터를 배열로 마이그레이션
UPDATE users 
SET preferred_languages = ARRAY[COALESCE(preferred_language, 'en')]::TEXT[]
WHERE preferred_languages IS NULL OR preferred_languages = '{}'::TEXT[];

-- 3. contractors 테이블에도 추가
ALTER TABLE contractors 
ADD COLUMN IF NOT EXISTS preferred_languages TEXT[] DEFAULT ARRAY['en']::TEXT[];

-- 4. 인덱스 추가 (GIN 인덱스로 배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_preferred_languages ON users USING GIN(preferred_languages);
CREATE INDEX IF NOT EXISTS idx_contractors_preferred_languages ON contractors USING GIN(preferred_languages);

-- 5. 이메일 발송 언어 결정 함수 생성
-- 영어가 포함되면 영어, 영어 없이 중국어만 있으면 중국어, 영어 없이 한국어만 있으면 한국어
CREATE OR REPLACE FUNCTION determine_email_language(languages TEXT[])
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- 배열이 비어있으면 영어
  IF languages IS NULL OR array_length(languages, 1) IS NULL THEN
    RETURN 'en';
  END IF;
  
  -- 영어가 포함되어 있으면 영어
  IF 'en' = ANY(languages) THEN
    RETURN 'en';
  END IF;
  
  -- 영어 없이 중국어만 있으면 중국어
  IF 'zh' = ANY(languages) AND NOT 'ko' = ANY(languages) THEN
    RETURN 'zh';
  END IF;
  
  -- 영어 없이 한국어만 있으면 한국어
  IF 'ko' = ANY(languages) AND NOT 'zh' = ANY(languages) THEN
    RETURN 'ko';
  END IF;
  
  -- 기본값 영어
  RETURN 'en';
END;
$$;

-- 6. 사용자 프로필 자동 생성 함수 업데이트 (preferred_languages 포함)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pref_langs TEXT[];
BEGIN
  -- raw_user_meta_data에서 preferred_languages 추출
  -- JSON 배열을 PostgreSQL 배열로 변환
  IF NEW.raw_user_meta_data ? 'preferred_languages' THEN
    SELECT array_agg(elem::TEXT)
    INTO pref_langs
    FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'preferred_languages') AS elem;
  ELSE
    -- 단일 언어가 있으면 배열로 변환
    pref_langs := ARRAY[COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')]::TEXT[];
  END IF;

  INSERT INTO public.users (
    id, 
    email, 
    first_name,
    last_name,
    phone,
    preferred_language,
    preferred_languages,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(pref_langs[1], 'en'),
    COALESCE(pref_langs, ARRAY['en']::TEXT[]),
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    preferred_language = COALESCE(pref_langs[1], 'en'),
    preferred_languages = COALESCE(pref_langs, ARRAY['en']::TEXT[]),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- 7. 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 확인
SELECT 
  id,
  email,
  first_name,
  preferred_language,
  preferred_languages,
  determine_email_language(preferred_languages) as email_language
FROM users
LIMIT 5;
