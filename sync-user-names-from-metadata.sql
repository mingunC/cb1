-- Sync user names from auth.users metadata to users table
-- This will update existing users who signed up with names but don't have them in users table

UPDATE users u
SET 
  first_name = COALESCE(au.raw_user_meta_data->>'first_name', u.first_name),
  last_name = COALESCE(au.raw_user_meta_data->>'last_name', u.last_name),
  phone = COALESCE(au.raw_user_meta_data->>'phone', u.phone),
  updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
  AND (
    u.first_name IS NULL 
    OR u.last_name IS NULL
    OR u.first_name = ''
    OR u.last_name = ''
  )
  AND (
    au.raw_user_meta_data->>'first_name' IS NOT NULL
    OR au.raw_user_meta_data->>'last_name' IS NOT NULL
  );

-- Check the results
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  au.raw_user_meta_data->>'first_name' as meta_first_name,
  au.raw_user_meta_data->>'last_name' as meta_last_name
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email LIKE 'devryan.choi%';
