import formData from 'form-data';
import Mailgun from 'mailgun.js';

// 디버깅을 위한 로그 추가
console.log('Mailgun Config:', {
  hasApiKey: !!process.env.MAILGUN_API_KEY,
  apiKeyLength: process.env.MAILGUN_API_KEY?.length,
  domain: process.env.MAILGUN_DOMAIN,
  url: process.env.MAILGUN_DOMAIN_URL
});

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
    console.error('Mailgun credentials missing:', {
      hasApiKey: !!process.env.MAILGUN_API_KEY,
      hasDomain: !!process.env.MAILGUN_DOMAIN
    });
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

    console.log('Attempting to send email with:', {
      from: messageData.from,
      to: messageData.to,
      subject: messageData.subject,
      domain: process.env.MAILGUN_DOMAIN
    });

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    
    console.log('✅ Email sent successfully:', response.id);
    return { success: true, messageId: response.id };
  } catch (error: any) {
    console.error('❌ Mailgun API Error Details:', {
      message: error.message,
      status: error.status,
      details: error.details || error.response?.body || error
    });
    return { success: false, error: error.message };
  }
};

// 수수료 계산 함수
export const calculateCommission = (budget: number): string => {
  const commissionRate = 0.10;
  const commission = budget * commissionRate;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(commission);
};

// 번역 매핑 함수들
const formatProjectTypes = (projectTypes: string[]): string => {
  const projectTypeMap: { [key: string]: string } = {
    'kitchen': '주방',
    'bathroom': '욕실',
    'basement': '지하실',
    'painting': '페인팅',
    'flooring': '바닥',
    'full-renovation': '전체 리노베이션',
    'full_renovation': '전체 리노베이션',
    'restaurant': '레스토랑',
    'retail': '소매점',
    'office': '사무실',
    'education': '교육시설',
    'other': '기타'
  }
  
  return projectTypes.map(type => projectTypeMap[type] || type).join(', ')
}

const formatSpaceType = (spaceType: string): string => {
  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': '단독주택',
    'detached_house': '단독주택',
    'condo': '콘도',
    'townhouse': '타운하우스',
    'town_house': '타운하우스',
    'commercial': '상업',
    'beecroft': '비크로프트',
    'apartment': '아파트',
    'house': '주택'
  }
  
  return spaceTypeMap[spaceType] || spaceType
}

// ✅ 업체에게 보낼 이메일 템플릿 (고객 정보 포함)
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any,
  customerInfo?: any // 고객 정보 추가
): string => {
  const commission = calculateCommission(quoteInfo.price);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + 7); // 7일 후로 변경
  
  // 고객 이름
  const customerName = customerInfo 
    ? `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim() || '고객'
    : '고객';
  
  // 고객 전화번호 (있는 경우에만 표시)
  const hasPhone = customerInfo?.phone && customerInfo.phone.trim() !== '';
  const hasEmail = customerInfo?.email && customerInfo.email.trim() !== '';
  
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
        .customer-info { background-color: #fff9e6; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 12px 8px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 35%; color: #555; }
        .contact-info { font-size: 16px; font-weight: bold; color: #4A90E2; }
        .warning-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 5px; }
        .commission-box { background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 5px; }
        .steps { counter-reset: step-counter; list-style: none; padding: 0; }
        .steps li { counter-increment: step-counter; margin: 15px 0; padding-left: 30px; position: relative; }
        .steps li::before { content: counter(step-counter); position: absolute; left: 0; background: #4A90E2; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트에 선정되셨습니다</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${contractorName}</strong>님</p>
          
          <p>We are pleased to inform you that the quotation you submitted has been selected. The customer has finally chosen your company's quotation.</p>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #333;">📞 Customer Contact Information</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>Customer Name</td>
                <td class="contact-info">${customerName}</td>
              </tr>
              ${hasEmail ? `
              <tr>
                <td>Email</td>
                <td class="contact-info">${customerInfo.email}</td>
              </tr>
              ` : ''}
              ${hasPhone ? `
              <tr>
                <td>Phone Number</td>
                <td class="contact-info">${customerInfo.phone}</td>
              </tr>
              ` : `
              <tr>
                <td>Phone Number</td>
                <td style="color: #999; font-style: italic;">The customer did not provide a phone number.</td>
              </tr>
              `}
            </table>
            ${!hasPhone ? `
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;">
              ⚠️ <strong>안내:</strong> The customer did not enter a phone number. Please contact them via email first, or confirm their contact details during the on-site visit.
            </div>
            ` : ''}
          </div>
          
          <div class="warning-box">
            <strong>⚠️ Important Notice</strong>
            <p style="margin: 10px 0 0 0;">Please contact the customer <strong>as soon as possible</strong> to coordinate the project schedule. Prompt response enhances customer satisfaction.</p>
          </div>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 Project Information</h3>
            <table class="info-table">
              <tr>
                <td>Project Type</td>
                <td>${formatProjectTypes(projectInfo.project_types || [])}</td>
              </tr>
              <tr>
                <td>Property Type</td>
                <td>${formatSpaceType(projectInfo.space_type || '')}</td>
              </tr>
              <tr>
                <td>Address</td>
                <td>${projectInfo.full_address || 'Detailed address: Please inquire with the customer.'}</td>
              </tr>
              <tr>
                <td>Quotation Amount</td>
                <td><strong style="font-size: 18px; color: #4A90E2;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="commission-box">
            <h3 style="margin-top: 0; color: #333;">💰 Platform Commission Information</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>Platform Commission</td>
                <td><strong style="font-size: 18px; color: #28a745;">${commission}</strong></td>
              </tr>
              <tr>
                <td>Commission Rate</td>
                <td>
                    <strong>1% of the quotation amount</strong> : $100,000+<br>
                    <strong>2% of the quotation amount</strong> : $50,000 - $100,000<br>
                    <strong>3% of the quotation amount</strong> : Under $50,000
                </td>
              </tr>
              <tr>
                <td>Payment Due Date</td>
                <td>${completionDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>
            <div style="background: #e7f3ff; padding: 12px; border-radius: 5px; margin-top: 15px; font-size: 14px; color: #333;">
              <strong>📌 Commission Policy:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Please pay the commission within 3 days after the project contract is signed.</li>
                <li>If the final project amount changes, the commission will be recalculated based on the changed amount.</li>
                <li>Deposit account information will be provided separately.</li>
              </ul>
            </div>
          </div>
          
          <h3>📌 Next Steps</h3>
          <ol class="steps">
            <li><strong>Contact the Customer</strong>: ${hasPhone ? 'Email or phone' : 'Email'} to coordinate the schedule</li>
            <li><strong>Site Visit</strong>: Schedule a visit and confirm the detailed quotation</li>
            <li><strong>Contract Signing</strong>: Write and sign the contract</li>
            <li><strong>Progress Update</strong>: Email the start date of the project to Canada Beaver</li>
            <li><strong>Commission Payment</strong>: Pay the platform commission within 3 days after the contract is signed</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              Check in Dashboard
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            If you have any questions during the project, please contact us anytime.
          </p>
          
          <p>
            Thank you.<br>
            <strong>Canada Beaver 팀</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>This email was automatically sent by the Canada Beaver Platform.</p>
          <p>Contact: support@canadabeaver.pro | Website: www.canadabeaver.pro</p>
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
        .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .info-table td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 35%; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success-badge { background-color: #d4edda; color: #155724; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 15px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Contractor Selected</h1>
          <p style="margin: 0; font-size: 18px;">The project is ready to start</p>
        </div>
        
        <div class="content">
          <p>Hello, <strong>${customerName}</strong>님</p>
          
          <div class="success-badge">
            🎉 The contractor you selected has been confirmed!
          </div>
          
          <p>We are pleased to inform you that the contractor you selected has been confirmed.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">🏢 Selected Contractor Information</h3>
            <table class="info-table">
              <tr>
                <td>Contractor Name</td>
                <td><strong>${contractorInfo.company_name}</strong></td>
              </tr>
              <tr>
                <td>Contact Name</td>
                <td>${contractorInfo.contact_name || contractorInfo.company_name}</td>
              </tr>
              ${contractorInfo.phone ? `
              <tr>
                <td>Phone Number</td>
                <td><strong>${contractorInfo.phone}</strong></td>
              </tr>
              ` : ''}
              ${contractorInfo.email ? `
              <tr>
                <td>Email</td>
                <td>${contractorInfo.email}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Quotation Amount</td>
                <td><strong style="color: #28a745; font-size: 18px;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📞 Next Steps:</strong>
            <p style="margin: 10px 0 0 0;">The selected contractor will contact you soon to coordinate the project schedule and details.</p>
          </div>
          
          <p>We hope the project is successful!</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              Check My Quotes
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            If you have any questions during the project, please contact us anytime at support@canadabeaver.pro.
          </p>
        </div>
        
        <div class="footer">
          <p>This email was automatically sent by the Canada Beaver Platform.</p>
          <p>© 2024 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// API 키 검증 함수 (테스트용)
export const verifyMailgunConfig = async () => {
  try {
    console.log('Verifying Mailgun configuration...');
    
    // 도메인 정보 가져오기 테스트
    const domain = await mg.domains.get(process.env.MAILGUN_DOMAIN!);
    
    console.log('Mailgun domain verified:', {
      name: domain.name,
      state: domain.state,
      created_at: domain.created_at
    });
    
    return { success: true, domain };
  } catch (error: any) {
    console.error('Mailgun verification failed:', error);
    return { success: false, error: error.message };
  }
};
