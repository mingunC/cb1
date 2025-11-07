-- Recreate and verify the user trigger to ensure it works properly

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for user: %', NEW.email;
  RAISE NOTICE 'Metadata: %', NEW.raw_user_meta_data;
  
  -- Insert or update user data
  INSERT INTO public.users (
    id, 
    email, 
    user_type, 
    first_name,
    last_name,
    phone,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    user_type = COALESCE(EXCLUDED.user_type, users.user_type),
    updated_at = NOW();
  
  RAISE NOTICE 'User record created/updated successfully';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Sync existing users (run this for already registered users)
INSERT INTO public.users (
  id, 
  email, 
  user_type, 
  first_name,
  last_name,
  phone,
  created_at, 
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'user_type', 'customer'),
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.raw_user_meta_data->>'phone',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL  -- Only insert users that don't exist
ON CONFLICT (id) DO UPDATE SET
  first_name = COALESCE(EXCLUDED.first_name, users.first_name),
  last_name = COALESCE(EXCLUDED.last_name, users.last_name),
  phone = COALESCE(EXCLUDED.phone, users.phone),
  updated_at = NOW();

-- 6. Check results
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.phone,
  u.user_type,
  au.raw_user_meta_data->>'first_name' as meta_first_name,
  au.raw_user_meta_data->>'last_name' as meta_last_name
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 10;
