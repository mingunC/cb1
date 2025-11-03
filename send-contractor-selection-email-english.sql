-- Send congratulations email to contractor when selected for a project (ENGLISH VERSION)
CREATE OR REPLACE FUNCTION send_contractor_selection_email()
RETURNS TRIGGER AS $$
DECLARE
  contractor_info RECORD;
  project_info RECORD;
  email_content TEXT;
BEGIN
  -- Only execute when contractor_quotes status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    
    -- Get selected contractor information
    SELECT 
      c.company_name,
      c.contact_name,
      c.email,
      c.phone
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
      u.email as customer_email,
      u.user_metadata->>'name' as customer_name
    INTO project_info
    FROM quote_requests qr
    LEFT JOIN auth.users u ON qr.customer_id = u.id
    WHERE qr.id = NEW.project_id;
    
    -- Create email content in English
    email_content := format('
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">You have been selected for the project</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello, %s!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Your quote for the <strong>%s</strong> project has been selected! 
            The customer has chosen your company to work with.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">📋 Project Information</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Space Type:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Budget Range:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Location:</strong> %s</li>
              <li style="margin: 8px 0;"><strong>Your Quote:</strong> $%s</li>
            </ul>
          </div>
          
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">💰 Next Step: Service Fee Payment</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              To receive customer contact information and project details, please <strong>submit the service fee payment</strong>.<br>
              Once we confirm your payment, we will provide you with the customer''s contact details.
            </p>
            
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px;"><strong>Bank Account:</strong> Kookmin Bank 123456-78-901234</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Account Holder:</strong> Renovation Inc.</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Service Fee:</strong> 5%% of quote amount (minimum $50)</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-renovation-site.com/contractor" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Go to Contractor Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #666;">
            <p>If you have any questions, please feel free to contact us.</p>
            <p>Email: support@renovation.com | Phone: 1588-1234</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Renovation Platform. All rights reserved.</p>
        </div>
      </div>
    ', 
    contractor_info.contact_name,
    COALESCE(project_info.description, 'Renovation'),
    project_info.space_type,
    project_info.budget,
    project_info.full_address,
    NEW.price
    );
    
    -- Call Supabase Edge Function to send email
    PERFORM net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'to', contractor_info.email,
        'subject', '🎉 Congratulations! You Have Been Selected - Service Fee Payment Information',
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
DROP TRIGGER IF EXISTS contractor_selection_email_trigger ON contractor_quotes;

-- Create trigger
CREATE TRIGGER contractor_selection_email_trigger
  AFTER UPDATE ON contractor_quotes
  FOR EACH ROW
  EXECUTE FUNCTION send_contractor_selection_email();
