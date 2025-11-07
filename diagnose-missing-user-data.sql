-- Check where the user data actually is
-- This will show if the data exists in auth.users metadata but not in users table

-- 1. Check auth.users metadata (회원가입 시 입력한 정보가 여기 저장됨)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data->>'first_name' as meta_first_name,
  raw_user_meta_data->>'last_name' as meta_last_name,
  raw_user_meta_data->>'phone' as meta_phone,
  raw_user_meta_data->>'user_type' as meta_user_type
FROM auth.users
WHERE email LIKE 'devryan.choi%';

-- 2. Check users table (트리거가 복사해야 하는 곳)
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  user_type,
  created_at
FROM users
WHERE email LIKE 'devryan.choi%';

-- 3. Check if trigger exists and is enabled
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  tgenabled,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. If data exists in auth but not in users, manually sync it
-- UPDATE users u
-- SET 
--   first_name = au.raw_user_meta_data->>'first_name',
--   last_name = au.raw_user_meta_data->>'last_name',
--   phone = au.raw_user_meta_data->>'phone',
--   updated_at = NOW()
-- FROM auth.users au
-- WHERE u.id = au.id
--   AND u.email LIKE 'devryan.choi%';
