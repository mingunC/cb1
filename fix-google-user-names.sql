-- Google 로그인 사용자 이름 문제 수정

-- 1. 트리거 함수 업데이트 (User 기본값 제거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  full_name TEXT;
  name_parts TEXT[];
BEGIN
  -- 전체 이름을 가져와서 파싱
  full_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  -- 이름을 공백으로 분리
  name_parts := string_to_array(trim(full_name), ' ');
  
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
    -- given_name이 있으면 사용, 없으면 full_name의 첫 부분
    COALESCE(
      NEW.raw_user_meta_data->>'given_name', 
      CASE WHEN array_length(name_parts, 1) >= 1 THEN name_parts[1] ELSE split_part(NEW.email, '@', 1) END
    ),
    -- family_name이 있으면 사용, 없으면 full_name의 나머지 부분 (User 제외)
    CASE 
      WHEN NEW.raw_user_meta_data->>'family_name' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'family_name' != 'User' 
      THEN NEW.raw_user_meta_data->>'family_name'
      WHEN array_length(name_parts, 1) >= 2 
      THEN array_to_string(name_parts[2:array_length(name_parts, 1)], ' ')
      ELSE ''
    END,
    'customer',
    false,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 기존 사용자들의 잘못된 이름 수정
UPDATE public.users 
SET 
  first_name = CASE 
    WHEN last_name = 'User' THEN 
      CASE 
        WHEN first_name LIKE '% %' THEN split_part(first_name, ' ', 1)
        ELSE first_name 
      END
    ELSE first_name
  END,
  last_name = CASE 
    WHEN last_name = 'User' THEN 
      CASE 
        WHEN first_name LIKE '% %' THEN 
          trim(substring(first_name from position(' ' in first_name) + 1))
        ELSE ''
      END
    ELSE last_name
  END,
  updated_at = NOW()
WHERE last_name = 'User' OR first_name LIKE '%User%';

-- 3. "User"가 포함된 이름 정리
UPDATE public.users 
SET 
  first_name = trim(replace(first_name, 'User', '')),
  last_name = trim(replace(last_name, 'User', '')),
  updated_at = NOW()
WHERE first_name LIKE '%User%' OR last_name LIKE '%User%';

-- 4. 빈 last_name을 NULL로 변경
UPDATE public.users 
SET last_name = NULL, updated_at = NOW()
WHERE last_name = '' OR trim(last_name) = '';

-- 확인 쿼리
SELECT 
  email,
  first_name,
  last_name,
  CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as full_name
FROM public.users 
WHERE email LIKE '%choi%' OR email LIKE '%mgc%'
ORDER BY created_at DESC;
