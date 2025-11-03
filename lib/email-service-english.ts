import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_DOMAIN_URL || 'https://api.mailgun.net'
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Email sending function
export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Mailgun credentials are not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const messageData = {
      from: options.from || `CB1 Platform <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      'h:Reply-To': options.replyTo || 'support@canadabeaver.pro'
    };

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    
    console.log('Email sent successfully:', response.id);
    return { success: true, messageId: response.id };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// Commission calculation function
export const calculateCommission = (budget: number): string => {
  // Example: Calculate 10% of project budget as commission
  const commissionRate = 0.10;
  const commission = budget * commissionRate;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(commission);
};

// Email template for contractor selection
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any
): string => {
  const commission = calculateCommission(quoteInfo.price);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + 7);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .highlight { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 40%; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p style="margin: 0; font-size: 18px;">You have been selected for the project</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${contractorName}</strong></p>
          
          <p>We are pleased to inform you that your quote has been selected by the customer.</p>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 Project Information</h3>
            <table class="info-table">
              <tr>
                <td>Project Type:</td>
                <td>${projectInfo.project_type || 'Renovation'}</td>
              </tr>
              <tr>
                <td>Space Type:</td>
                <td>${projectInfo.space_type || 'Residential'}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>${projectInfo.address || 'TBD'}</td>
              </tr>
              <tr>
                <td>Quote Amount:</td>
                <td><strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quoteInfo.price)}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="highlight" style="background-color: #fff3cd; border-left-color: #ffc107;">
            <h3 style="margin-top: 0;">💰 Commission Information</h3>
            <table class="info-table">
              <tr>
                <td>Estimated Commission:</td>
                <td><strong>${commission}</strong></td>
              </tr>
              <tr>
                <td>Commission Rate:</td>
                <td>10% of quote amount</td>
              </tr>
              <tr>
                <td>Expected Payment Date:</td>
                <td>${completionDate.toLocaleDateString('en-US')}</td>
              </tr>
            </table>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
              * Commission will be paid within 7 days after project completion.<br>
              * Actual commission may be adjusted based on final project amount.
            </p>
          </div>
          
          <h3>📌 Next Steps</h3>
          <ol>
            <li>Contact the customer directly to coordinate detailed schedule</li>
            <li>Proceed with contract drafting and signing</li>
            <li>Update project progress on your dashboard</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              View on Dashboard
            </a>
          </center>
          
          <p style="margin-top: 30px;">
            If you have any questions during the project, please don't hesitate to contact us.
          </p>
          
          <p>
            Thank you,<br>
            <strong>Canada Beaver Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This email was automatically sent from Canada Beaver Platform.</p>
          <p>Contact: support@canadabeaver.pro</p>
          <p>© 2024 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email template for customer notification
export const createCustomerNotificationTemplate = (
  customerName: string,
  contractorInfo: any,
  projectInfo: any,
  quoteInfo: any
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Contractor Selected</h1>
          <p style="margin: 0; font-size: 18px;">Your project is ready to begin</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${customerName}</strong></p>
          
          <p>Here is the information for your selected contractor.</p>
          
          <div class="info-box">
            <h3>Selected Contractor Information</h3>
            <p><strong>Company Name:</strong> ${contractorInfo.company_name}</p>
            <p><strong>Contact Person:</strong> ${contractorInfo.contact_name}</p>
            <p><strong>Phone:</strong> ${contractorInfo.phone || 'Contact contractor'}</p>
            <p><strong>Quote Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quoteInfo.price)}</p>
          </div>
          
          <p>The contractor will contact you soon. We hope your project is completed successfully!</p>
          
          <center>
            <a href="https://canadabeaver.pro/mypage" class="button">
              View My Page
            </a>
          </center>
        </div>
        
        <div class="footer">
          <p>© 2024 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email template for site visit application notification to customer
export const createSiteVisitNotificationTemplate = (
  customerName: string,
  contractorInfo: any,
  projectInfo: any
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-table { width: 100%; margin: 10px 0; }
        .info-table td { padding: 8px 0; }
        .info-table td:first-child { font-weight: bold; width: 40%; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 New Site Visit Application</h1>
          <p style="margin: 0; font-size: 18px;">A contractor has applied to visit your project site</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${customerName}</strong></p>
          
          <p><strong>${contractorInfo.company_name}</strong> has applied to visit your project site. They are interested in providing you with a detailed quote after inspecting your space.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">🏢 Contractor Information</h3>
            <table class="info-table">
              <tr>
                <td>Company:</td>
                <td>${contractorInfo.company_name}</td>
              </tr>
              <tr>
                <td>Contact Person:</td>
                <td>${contractorInfo.contact_name || 'N/A'}</td>
              </tr>
              <tr>
                <td>Phone:</td>
                <td>${contractorInfo.phone || 'Will be provided upon approval'}</td>
              </tr>
              <tr>
                <td>Specialties:</td>
                <td>${contractorInfo.specialties ? contractorInfo.specialties.join(', ') : 'General renovation'}</td>
              </tr>
            </table>
          </div>
          
          <div class="info-box" style="border-left-color: #34a853;">
            <h3 style="margin-top: 0; color: #34a853;">📋 Your Project Details</h3>
            <table class="info-table">
              <tr>
                <td>Space Type:</td>
                <td>${projectInfo.space_type}</td>
              </tr>
              <tr>
                <td>Budget Range:</td>
                <td>${projectInfo.budget}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>${projectInfo.full_address}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">📅 Next Steps</h3>
            <p style="margin: 0; font-size: 14px;">
              Please log in to your dashboard to <strong>review this application</strong> and decide whether to approve or decline the site visit request. You can view the contractor's portfolio and ratings before making your decision.
            </p>
          </div>
          
          <center>
            <a href="https://canadabeaver.pro/customer/dashboard" class="button">
              View Application
            </a>
          </center>
          
          <p style="margin-top: 30px;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <p>
            Best regards,<br>
            <strong>Canada Beaver Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This email was automatically sent from Canada Beaver Platform.</p>
          <p>Contact: support@canadabeaver.pro</p>
          <p>© 2024 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
