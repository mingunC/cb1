-- Fix users table RLS policy for signup
-- Run this in Supabase SQL Editor

-- 1. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Drop existing INSERT policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow signup insert" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON users;

-- 3. Create new INSERT policy for signup
-- This allows users to insert their own record during signup
CREATE POLICY "Enable insert during signup"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.uid() = id);

-- 4. Ensure SELECT policy exists (for viewing own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. Ensure UPDATE policy exists (for updating own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Check final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
