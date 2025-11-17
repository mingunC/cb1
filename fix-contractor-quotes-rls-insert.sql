-- Fix contractor_quotes RLS policy for INSERT operations
-- This allows contractors to insert their own quotes

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Contractors can insert their own quotes" ON contractor_quotes;

-- Create new INSERT policy
CREATE POLICY "Contractors can insert their own quotes"
ON contractor_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insert if the contractor_id matches the authenticated user's contractor record
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

-- Also ensure SELECT policy exists for contractors to view their own quotes
DROP POLICY IF EXISTS "Contractors can view their own quotes" ON contractor_quotes;

CREATE POLICY "Contractors can view their own quotes"
ON contractor_quotes
FOR SELECT
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
  OR
  -- Also allow customers to view quotes for their projects
  project_id IN (
    SELECT id FROM quote_requests WHERE customer_id = auth.uid()
  )
);

-- Ensure UPDATE policy exists for contractors to update their own quotes
DROP POLICY IF EXISTS "Contractors can update their own quotes" ON contractor_quotes;

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

-- Ensure DELETE policy exists for contractors to delete their own quotes
DROP POLICY IF EXISTS "Contractors can delete their own quotes" ON contractor_quotes;

CREATE POLICY "Contractors can delete their own quotes"
ON contractor_quotes
FOR DELETE
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE user_id = auth.uid()
  )
);

-- Enable RLS on the table if not already enabled
ALTER TABLE contractor_quotes ENABLE ROW LEVEL SECURITY;

-- Verify the policies
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
