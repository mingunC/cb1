-- Google OAuth 이름 매핑 개선 버전
-- 'User' 문자열을 자동으로 제거하고 깔끔한 이름만 저장

-- 1. 개선된 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  final_first_name text;
  final_last_name text;
  raw_first text;
  raw_last text;
BEGIN
  -- Google OAuth 로그인인 경우
  IF NEW.provider = 'google' THEN
    -- Google에서 제공하는 필드 가져오기
    raw_first := NEW.raw_user_meta_data->>'given_name';
    raw_last := NEW.raw_user_meta_data->>'family_name';
    
    -- 'User' 문자열 제거 함수
    raw_first := TRIM(REGEXP_REPLACE(COALESCE(raw_first, ''), 'User|user', '', 'gi'));
    raw_last := TRIM(REGEXP_REPLACE(COALESCE(raw_last, ''), 'User|user', '', 'gi'));
    
    -- first_name 설정
    final_first_name := CASE 
      WHEN raw_first IS NOT NULL AND raw_first != '' THEN raw_first
      ELSE split_part(NEW.email, '@', 1)
    END;
    
    -- last_name 설정
    final_last_name := CASE 
      WHEN raw_last IS NOT NULL AND raw_last != '' THEN raw_last
      ELSE NULL
    END;
    
    -- 디버깅 로그
    RAISE NOTICE 'Google 사용자 생성: email=%, raw_given=%, raw_family=%, final_first=%, final_last=%', 
      NEW.email, 
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'family_name',
      final_first_name, 
      final_last_name;
      
  ELSE
    -- 일반 이메일/패스워드 로그인
    raw_first := NEW.raw_user_meta_data->>'first_name';
    raw_last := NEW.raw_user_meta_data->>'last_name';
    
    -- 'User' 문자열 제거
    raw_first := TRIM(REGEXP_REPLACE(COALESCE(raw_first, ''), 'User|user', '', 'gi'));
    raw_last := TRIM(REGEXP_REPLACE(COALESCE(raw_last, ''), 'User|user', '', 'gi'));
    
    final_first_name := CASE 
      WHEN raw_first IS NOT NULL AND raw_first != '' THEN raw_first
      ELSE split_part(NEW.email, '@', 1)
    END;
    
    final_last_name := CASE 
      WHEN raw_last IS NOT NULL AND raw_last != '' THEN raw_last
      ELSE NULL
    END;
  END IF;
  
  -- 최종 검증: 빈 문자열을 NULL로 변환
  IF final_first_name = '' THEN final_first_name := NULL; END IF;
  IF final_last_name = '' THEN final_last_name := NULL; END IF;
  
  -- 사용자 레코드 생성
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    user_type,
    is_anonymous,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    final_first_name,
    final_last_name,
    'customer',
    false,
    NEW.created_at,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거가 없으면 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 모든 기존 사용자의 이름에서 'User' 제거
UPDATE public.users 
SET 
  first_name = CASE
    WHEN first_name IS NOT NULL THEN 
      NULLIF(TRIM(REGEXP_REPLACE(first_name, 'User|user', '', 'gi')), '')
    ELSE first_name
  END,
  last_name = CASE
    WHEN last_name IS NOT NULL THEN 
      NULLIF(TRIM(REGEXP_REPLACE(last_name, 'User|user', '', 'gi')), '')
    ELSE last_name
  END,
  updated_at = NOW()
WHERE 
  (first_name ILIKE '%User%' OR last_name ILIKE '%User%')
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- 4. 결과 확인
SELECT 
  '=== 이름 정리 완료 ===' as section,
  '' as email, '' as first_name, '' as last_name;

SELECT 
  email,
  first_name,
  last_name,
  CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as full_name,
  user_type
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. Google 사용자 특별 확인
SELECT 
  '=== Google OAuth 사용자 ===' as section,
  '' as email, '' as first_name, '' as last_name;

SELECT 
  u.email,
  u.first_name,
  u.last_name,
  au.raw_user_meta_data->>'given_name' as google_given_name,
  au.raw_user_meta_data->>'family_name' as google_family_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.provider = 'google'
ORDER BY u.created_at DESC;
