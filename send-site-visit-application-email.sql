-- Send email notification to customer when contractor applies for site visit
CREATE OR REPLACE FUNCTION send_site_visit_application_email()
RETURNS TRIGGER AS $$
DECLARE
  contractor_info RECORD;
  project_info RECORD;
  customer_info RECORD;
  email_content TEXT;
BEGIN
  -- Only execute when a new site visit application is created
  IF TG_OP = 'INSERT' THEN
    
    -- Get contractor information
    SELECT 
      c.company_name,
      c.contact_name,
      c.email as contractor_email,
      c.phone,
      c.specialties
    INTO contractor_info
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    -- Get project information
    SELECT 
      qr.space_type,
      qr.project_types,
      qr.budget,
      qr.full_address,
      qr.description,
      qr.customer_id
    INTO project_info
    FROM quote_requests qr
    WHERE qr.id = NEW.project_id;
    
    -- Get customer information
    SELECT 
      u.email as customer_email,
      u.user_metadata->>'name' as customer_name
    INTO customer_info
    FROM auth.users u
    WHERE u.id = project_info.customer_id;
    
    -- Create email content in English
    email_content := format('
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 New Site Visit Request</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">A contractor has applied to visit your project site</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello, %s!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            <strong>%s</strong> has applied to visit your project site. 
            They are interested in providing you with a detailed quote after inspecting your space.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">🏢 Contractor Information</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Company:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Contact Person:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Phone:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Specialties:</strong> %s</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #34a853;">
            <h3 style="margin-top: 0; color: #333;">📋 Your Project Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Space Type:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Budget:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Location:</strong> %s</li>
            </ul>
          </div>
          
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">📅 Next Steps</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              Please log in to your dashboard to <strong>review this application</strong> and decide whether to approve or decline the site visit request.<br>
              You can view the contractor''s portfolio and ratings before making your decision.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-renovation-site.com/customer/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Application
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
            <p>If you have any questions, please don''t hesitate to contact us.</p>
            <p>Email: support@renovation.com | Phone: 1588-1234</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Renovation Platform. All rights reserved.</p>
        </div>
      </div>
    ', 
    COALESCE(customer_info.customer_name, 'Customer'),
    contractor_info.company_name,
    contractor_info.company_name,
    contractor_info.contact_name,
    COALESCE(contractor_info.phone, 'Not provided'),
    COALESCE(ARRAY_TO_STRING(contractor_info.specialties, ', '), 'General renovation'),
    project_info.space_type,
    project_info.budget,
    project_info.full_address
    );
    
    -- Call Supabase Edge Function to send email
    PERFORM net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'to', customer_info.customer_email,
        'subject', '🏠 New Site Visit Application for Your Project',
        'html', email_content,
        'contractor_name', contractor_info.contact_name,
        'company_name', contractor_info.company_name
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS site_visit_application_email_trigger ON site_visit_applications;

-- Create trigger
CREATE TRIGGER site_visit_application_email_trigger
  AFTER INSERT ON site_visit_applications
  FOR EACH ROW
  EXECUTE FUNCTION send_site_visit_application_email();

-- Test the trigger (comment out after testing)
-- SELECT * FROM site_visit_applications ORDER BY created_at DESC LIMIT 5;
