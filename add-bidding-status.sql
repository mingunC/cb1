-- Add 'bidding' status to quote_requests table
ALTER TABLE quote_requests 
DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests 
ADD CONSTRAINT quote_requests_status_check 
CHECK (status IN ('pending', 'approved', 'in_progress', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed', 'cancelled'));

-- Also update quotes table if it exists
ALTER TABLE quotes 
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('pending', 'approved', 'in_progress', 'site-visit-pending', 'site-visit-completed', 'bidding', 'quote-submitted', 'completed', 'cancelled'));
