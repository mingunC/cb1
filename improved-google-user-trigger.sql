-- Google OAuth 이름 처리 개선된 트리거

-- 1. 디버깅용 함수: Google 메타데이터 파싱 로직 테스트
CREATE OR REPLACE FUNCTION debug_google_name_parsing(
  raw_meta_data jsonb
) RETURNS TABLE (
  original_name text,
  given_name text,
  family_name text,
  parsed_first_name text,
  parsed_last_name text
) AS $$
DECLARE
  full_name text;
  name_parts text[];
  first_part text;
  last_part text;
BEGIN
  -- 원본 데이터
  original_name := raw_meta_data->>'name';
  given_name := raw_meta_data->>'given_name';
  family_name := raw_meta_data->>'family_name';
  
  -- 이름 파싱 로직
  full_name := COALESCE(original_name, '');
  name_parts := string_to_array(trim(full_name), ' ');
  
  -- First name 결정
  IF given_name IS NOT NULL AND given_name != '' THEN
    first_part := given_name;
  ELSIF array_length(name_parts, 1) >= 1 THEN
    first_part := name_parts[1];
  ELSE
    first_part := '';
  END IF;
  
  -- Last name 결정
  IF family_name IS NOT NULL AND family_name != '' AND family_name != 'User' THEN
    last_part := family_name;
  ELSIF array_length(name_parts, 1) >= 2 THEN
    -- 두 번째 부분부터 마지막까지 합치기
    last_part := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
  ELSE
    last_part := '';
  END IF;
  
  -- 결과 반환
  parsed_first_name := COALESCE(first_part, '');
  parsed_last_name := COALESCE(last_part, '');
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 2. 개선된 사용자 생성 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  full_name text;
  name_parts text[];
  final_first_name text;
  final_last_name text;
  google_given_name text;
  google_family_name text;
BEGIN
  -- Google OAuth 데이터 확인
  IF NEW.provider = 'google' THEN
    -- Google에서 제공하는 필드들
    google_given_name := NEW.raw_user_meta_data->>'given_name';
    google_family_name := NEW.raw_user_meta_data->>'family_name';
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    
    -- 로그용 (개발 환경에서만)
    RAISE NOTICE 'Google OAuth 데이터: email=%, name=%, given_name=%, family_name=%', 
      NEW.email, full_name, google_given_name, google_family_name;
    
    -- First name 처리
    IF google_given_name IS NOT NULL AND trim(google_given_name) != '' THEN
      final_first_name := trim(google_given_name);
    ELSE
      -- given_name이 없으면 full_name에서 첫 번째 단어
      name_parts := string_to_array(trim(full_name), ' ');
      IF array_length(name_parts, 1) >= 1 THEN
        final_first_name := name_parts[1];
      ELSE
        final_first_name := split_part(NEW.email, '@', 1); -- 이메일 사용자명 사용
      END IF;
    END IF;
    
    -- Last name 처리
    IF google_family_name IS NOT NULL AND trim(google_family_name) != '' AND google_family_name != 'User' THEN
      final_last_name := trim(google_family_name);
    ELSE
      -- family_name이 없으면 full_name에서 나머지 부분
      name_parts := string_to_array(trim(full_name), ' ');
      IF array_length(name_parts, 1) >= 2 THEN
        final_last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      ELSE
        final_last_name := ''; -- 성이 없는 경우
      END IF;
    END IF;
    
  ELSE
    -- 일반 로그인 (이메일/패스워드)
    final_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
    final_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  END IF;
  
  -- 빈 문자열을 NULL로 변환
  IF trim(final_first_name) = '' THEN final_first_name := NULL; END IF;
  IF trim(final_last_name) = '' THEN final_last_name := NULL; END IF;
  
  -- 사용자 레코드 삽입
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

-- 3. 기존 Google 사용자들의 이름 재파싱
DO $$
DECLARE
  user_record RECORD;
  parsed_first text;
  parsed_last text;
  full_name text;
  name_parts text[];
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, au.raw_user_meta_data, u.first_name, u.last_name
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    WHERE au.provider = 'google'
  LOOP
    -- 이름 재파싱
    full_name := user_record.raw_user_meta_data->>'name';
    
    -- First name
    IF user_record.raw_user_meta_data->>'given_name' IS NOT NULL THEN
      parsed_first := trim(user_record.raw_user_meta_data->>'given_name');
    ELSE
      name_parts := string_to_array(trim(full_name), ' ');
      IF array_length(name_parts, 1) >= 1 THEN
        parsed_first := name_parts[1];
      ELSE
        parsed_first := split_part(user_record.email, '@', 1);
      END IF;
    END IF;
    
    -- Last name
    IF user_record.raw_user_meta_data->>'family_name' IS NOT NULL 
       AND user_record.raw_user_meta_data->>'family_name' != 'User' THEN
      parsed_last := trim(user_record.raw_user_meta_data->>'family_name');
    ELSE
      name_parts := string_to_array(trim(full_name), ' ');
      IF array_length(name_parts, 1) >= 2 THEN
        parsed_last := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      ELSE
        parsed_last := '';
      END IF;
    END IF;
    
    -- 빈 문자열을 NULL로
    IF trim(parsed_first) = '' THEN parsed_first := NULL; END IF;
    IF trim(parsed_last) = '' THEN parsed_last := NULL; END IF;
    
    -- 업데이트 (실제로 변경된 경우에만)
    IF COALESCE(user_record.first_name, '') != COALESCE(parsed_first, '') 
       OR COALESCE(user_record.last_name, '') != COALESCE(parsed_last, '') THEN
      
      UPDATE public.users 
      SET 
        first_name = parsed_first,
        last_name = parsed_last,
        updated_at = NOW()
      WHERE id = user_record.id;
      
      RAISE NOTICE '사용자 업데이트: % - "%" → "%", "%" → "%"', 
        user_record.email, 
        user_record.first_name, parsed_first,
        user_record.last_name, parsed_last;
    END IF;
  END LOOP;
END
$$;

-- 4. 결과 확인 쿼리
SELECT 
  '=== Google OAuth 원본 데이터 ===' as section,
  '' as email, '' as current_first, '' as current_last, 
  '' as google_name, '' as google_given, '' as google_family;

SELECT 
  u.email,
  u.first_name as current_first,
  u.last_name as current_last,
  au.raw_user_meta_data->>'name' as google_name,
  au.raw_user_meta_data->>'given_name' as google_given,
  au.raw_user_meta_data->>'family_name' as google_family
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.provider = 'google'
ORDER BY u.created_at DESC;
