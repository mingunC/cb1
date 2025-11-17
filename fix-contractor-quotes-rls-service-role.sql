-- Fix contractor_quotes RLS to allow service role (admin client) operations
-- This ensures that API routes using createAdminClient() can insert quotes

-- First, let's check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'contractor_quotes';

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Contractors can insert their own quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Contractors can view their own quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Contractors can update their own quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Contractors can delete their own quotes" ON contractor_quotes;
DROP POLICY IF EXISTS "Service role can do anything" ON contractor_quotes;

-- Create policy for service role to bypass RLS (for admin operations)
CREATE POLICY "Service role can do anything"
ON contractor_quotes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create INSERT policy for authenticated contractors
CREATE POLICY "Contractors can insert their own quotes"
ON contractor_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

-- Create SELECT policy (contractors and customers can view)
CREATE POLICY "Contractors can view their own quotes"
ON contractor_quotes
FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT id FROM quote_requests WHERE customer_id = auth.uid()
  )
);

-- Create UPDATE policy for contractors
CREATE POLICY "Contractors can update their own quotes"
ON contractor_quotes
FOR UPDATE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

-- Create DELETE policy for contractors
CREATE POLICY "Contractors can delete their own quotes"
ON contractor_quotes
FOR DELETE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;

-- Verify the new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'contractor_quotes'
ORDER BY policyname;
