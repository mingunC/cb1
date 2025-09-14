-- Check existing projects in quote_requests table
SELECT id, customer_id, status, created_at 
FROM quote_requests 
ORDER BY created_at DESC 
LIMIT 5;
