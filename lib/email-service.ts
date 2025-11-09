import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Mailgun 초기화
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

// 이메일 발송 함수
export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Mailgun credentials are not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const messageData = {
      from: options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      'h:Reply-To': options.replyTo || process.env.EMAIL_REPLY_TO
    };

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    
    if (process.env.NODE_ENV === 'development') console.log('Email sent successfully:', response.id);
    return { success: true, messageId: response.id };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// 수수료 계산 함수 (견적 금액에 따라 1%, 2%, 3%)
export const calculateCommission = (quotePrice: number): { amount: string; rate: string; ratePercent: number } => {
  let commissionRate: number;
  let rateText: string;
  
  if (quotePrice >= 100000) {
    commissionRate = 0.01; // 1%
    rateText = '1% of the quotation amount';
  } else if (quotePrice >= 50000) {
    commissionRate = 0.02; // 2%
    rateText = '2% of the quotation amount';
  } else {
    commissionRate = 0.03; // 3%
    rateText = '3% of the quotation amount';
  }
  
  const commissionAmount = quotePrice * commissionRate;
  
  return {
    amount: `$${commissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rate: rateText,
    ratePercent: commissionRate * 100
  };
};

// 이메일 템플릿 생성 함수
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any
): string => {
  const commissionInfo = calculateCommission(quoteInfo.price);
  
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
          
          <p>We are pleased to inform you that your quote has been selected.</p>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 Project information</h3>
            <table class="info-table">
              <tr>
                <td>Project type:</td>
                <td>${projectInfo.project_type || 'Remodeling'}</td>
              </tr>
              <tr>
                <td>Property type:</td>
                <td>${projectInfo.space_type || 'Residential space'}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>${projectInfo.address || 'Toronto, Canada'}</td>
              </tr>
              <tr>
                <td>Quote amount:</td>
                <td><strong>$${quoteInfo.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="highlight" style="background-color: #fff3cd; border-left-color: #ffc107;">
            <h3 style="margin-top: 0;">💰 Platform Commission Information</h3>
            <table class="info-table">
              <tr>
                <td>Platform Commission:</td>
                <td><strong>${commissionInfo.amount}</strong></td>
              </tr>
              <tr>
                <td>Commission Rate:</td>
                <td>
                    <strong>1% of the quotation amount</strong> : $100,000+<br>
                    <strong>2% of the quotation amount</strong> : $50,000 - $100,000<br>
                    <strong>3% of the quotation amount</strong> : Under $50,000                
                </td>
              </tr>
              <tr>
                <td>Payment Due Date:</td>
                <td><strong>Please refer to the Policy</strong></td>
              </tr>
            </table>
            
            <h4 style="color: #d9534f; margin-top: 20px; margin-bottom: 10px;">📌 Commission Policy:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
              <li>Please pay the commission within 3 days after the project contract is signed.</li>
              <li>If the final project amount changes, the commission will be recalculated based on the changed amount.</li>
              <li>Deposit account information will be provided separately.</li>
            </ul>
          </div>
          
          <h3>📌 Next Steps</h3>
          <ol>
            <li><strong>Contact the Customer:</strong> Email to coordinate the schedule</li>
            <li><strong>Site Visit:</strong> Schedule a visit and confirm the detailed quotation</li>
            <li><strong>Contract Signing:</strong> Write and sign the contract</li>
            <li><strong>Progress Update:</strong> Email the start date of the project to Canada Beaver</li>
            <li><strong>Commission Payment:</strong> Pay the platform commission within 3 days after the contract is signed</li>
          </ol>
          
          <center>
            <a href="https://${process.env.APP_DOMAIN}/contractor" class="button">
              Check in the dashboard
            </a>
          </center>
          
          <p style="margin-top: 30px;">
            If you have any questions during the project, please contact us anytime.
          </p>
          
          <p>
            Thank you.<br>
            <strong>Canada Beaver Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This email was automatically sent by the Canada Beaver Platform.</p>
          <p>Contact: ${process.env.EMAIL_REPLY_TO}</p>
          <p>© 2025 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 고객에게 보낼 이메일 템플릿
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
          <h1>Contractor selected</h1>
          <p style="margin: 0; font-size: 18px;">The project is ready to start</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${customerName}</strong></p>
          
          <p>We are pleased to inform you about the contractor you selected.</p>
          
          <div class="info-box">
            <h3>Selected contractor information</h3>
            <p><strong>Contractor name:</strong> ${contractorInfo.company_name}</p>
            <p><strong>Contact name:</strong> ${contractorInfo.contact_name}</p>
            <p><strong>Phone number:</strong> ${contractorInfo.phone || 'Contact the contractor for more information'}</p>
            <p><strong>Quote amount:</strong> $${quoteInfo.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <p>The contractor will contact you soon. We hope the project is successful!</p>
          
          <center>
            <a href="https://canadabeaver.pro/mypage" class="button">
              Check in the dashboard
            </a>
          </center>
        </div>
        
        <div class="footer">
          <p>© 2025 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
