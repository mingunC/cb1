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

// 수수료 계산 함수
export const calculateCommission = (budget: number): string => {
  // 예시: 프로젝트 예산의 10%를 수수료로 계산
  const commissionRate = 0.10;
  const commission = budget * commissionRate;
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(commission);
};

// 이메일 템플릿 생성 함수
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
                <td><strong>${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(quoteInfo.price)}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="highlight" style="background-color: #fff3cd; border-left-color: #ffc107;">
            <h3 style="margin-top: 0;">💰 Commission information</h3>
            <table class="info-table">
              <tr>
                <td>Estimated commission:</td>
                <td><strong>${commission}</strong></td>
              </tr>
              <tr>
                <td>Commission rate:</td>
                <td>
                    <strong>1% of the quotation amount</strong> : $100,000+<br>
                    <strong>2% of the quotation amount</strong> : $50,000 - $100,000<br>
                    <strong>3% of the quotation amount</strong> : Under $50,000                
                </td>
              </tr>
              <tr>
                <td>Payment due date:</td>
                <td>${completionDate.toLocaleDateString('ko-KR')}</td>
              </tr>
            </table>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
              * The commission will be paid within 3 days after the project is completed.<br>
              * The actual commission may be adjusted based on the final project amount.
            </p>
          </div>
          
          <h3>📌 Next steps</h3>
          <ol>
            <li>Contact the customer directly to coordinate the detailed schedule.</li>
            <li>Write and sign the contract.</li>
            <li>Update the project status in the dashboard.</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
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
          <p>Contact: support@canadabeaver.pro</p>
          <p>© 2024 Canada Beaver. All rights reserved.</p>
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
          <h1>✅ Contractor selected</h1>
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
            <p><strong>Quote amount:</strong> ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(quoteInfo.price)}</p>
          </div>
          
          <p>The contractor will contact you soon. We hope the project is successful!</p>
          
          <center>
            <a href="https://canadabeaver.pro/mypage" class="button">
              Check in the dashboard
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
