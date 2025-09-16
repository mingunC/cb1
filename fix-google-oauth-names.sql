-- Google OAuth 이름 매핑 수정
-- given_name = first_name, family_name = last_name

-- 1. 간단하고 명확한 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  final_first_name text;
  final_last_name text;
BEGIN
  -- Google OAuth 로그인인 경우
  IF NEW.provider = 'google' THEN
    -- Google에서 제공하는 필드를 직접 매핑
    final_first_name := COALESCE(
      NEW.raw_user_meta_data->>'given_name',  -- Google의 given_name = first_name
      split_part(NEW.email, '@', 1)           -- 없으면 이메일 사용자명
    );
    
    final_last_name := NEW.raw_user_meta_data->>'family_name';  -- Google의 family_name = last_name
    
    -- 디버깅 로그 (개발환경에서만)
    RAISE NOTICE 'Google 사용자 생성: email=%, given_name=%, family_name=%, final_first=%, final_last=%', 
      NEW.email, 
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'family_name',
      final_first_name, 
      final_last_name;
      
  ELSE
    -- 일반 이메일/패스워드 로그인
    final_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1)
    );
    final_last_name := NEW.raw_user_meta_data->>'last_name';
  END IF;
  
  -- 빈 문자열이나 'User' 값을 NULL로 처리
  IF final_first_name = '' OR final_first_name = 'User' THEN 
    final_first_name := NULL; 
  END IF;
  
  IF final_last_name = '' OR final_last_name = 'User' THEN 
    final_last_name := NULL; 
  END IF;
  
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

-- 2. 기존 Google 사용자들의 이름 재매핑
UPDATE public.users 
SET 
  first_name = CASE 
    WHEN au.raw_user_meta_data->>'given_name' IS NOT NULL 
         AND au.raw_user_meta_data->>'given_name' != ''
         AND au.raw_user_meta_data->>'given_name' != 'User'
    THEN au.raw_user_meta_data->>'given_name'
    ELSE split_part(users.email, '@', 1)
  END,
  last_name = CASE 
    WHEN au.raw_user_meta_data->>'family_name' IS NOT NULL 
         AND au.raw_user_meta_data->>'family_name' != ''
         AND au.raw_user_meta_data->>'family_name' != 'User'
    THEN au.raw_user_meta_data->>'family_name'
    ELSE NULL
  END,
  updated_at = NOW()
FROM auth.users au
WHERE users.id = au.id 
  AND au.provider = 'google'
  AND (
    users.first_name != COALESCE(au.raw_user_meta_data->>'given_name', split_part(users.email, '@', 1))
    OR users.last_name != au.raw_user_meta_data->>'family_name'
    OR users.first_name LIKE '%User%'
    OR users.last_name LIKE '%User%'
  );

-- 3. 결과 확인
SELECT 
  '=== Google OAuth 사용자 이름 매핑 결과 ===' as section,
  '' as email, '' as first_name, '' as last_name, 
  '' as google_given_name, '' as google_family_name;

SELECT 
  u.email,
  u.first_name,
  u.last_name,
  au.raw_user_meta_data->>'given_name' as google_given_name,
  au.raw_user_meta_data->>'family_name' as google_family_name,
  au.raw_user_meta_data->>'name' as google_full_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.provider = 'google'
ORDER BY u.created_at DESC;
