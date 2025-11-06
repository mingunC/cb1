-- FIX: Contractor selection button not showing
-- Issue: Button only shows when project status is 'bidding' and quote status is 'submitted'

-- Step 1: Check current status
SELECT 
  qr.id as project_id,
  qr.status as project_status,
  qr.postal_code,
  qr.space_type,
  qr.project_types,
  cq.id as quote_id,
  cq.status as quote_status,
  cq.price,
  c.company_name
FROM quote_requests qr
LEFT JOIN contractor_quotes cq ON qr.id = cq.project_id
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE qr.postal_code = 'M2M 2M2'  -- From the screenshot
ORDER BY qr.created_at DESC;

-- Step 2: Fix project status to 'bidding'
UPDATE quote_requests
SET 
  status = 'bidding',
  updated_at = now()
WHERE postal_code = 'M2M 2M2'
  AND status != 'bidding'
  AND selected_contractor_id IS NULL;  -- Only if contractor not yet selected

-- Step 3: Fix contractor quote status to 'submitted'
UPDATE contractor_quotes
SET 
  status = 'submitted',
  updated_at = now()
WHERE project_id IN (
  SELECT id 
  FROM quote_requests 
  WHERE postal_code = 'M2M 2M2'
    AND selected_contractor_id IS NULL
)
AND status NOT IN ('submitted', 'accepted', 'rejected');

-- Step 4: Verify the fix
SELECT 
  qr.id as project_id,
  qr.status as project_status,
  qr.selected_contractor_id,
  cq.id as quote_id,
  cq.status as quote_status,
  cq.price,
  c.company_name
FROM quote_requests qr
LEFT JOIN contractor_quotes cq ON qr.id = cq.project_id
LEFT JOIN contractors c ON cq.contractor_id = c.id
WHERE qr.postal_code = 'M2M 2M2'
ORDER BY qr.created_at DESC;

-- Expected result:
-- project_status should be 'bidding'
-- quote_status should be 'submitted'
-- Now the Select button should appear on the My Page
