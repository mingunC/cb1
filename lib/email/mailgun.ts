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
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(commission);
};

// ✅ 업체에게 보낼 이메일 템플릿 (고객 정보 포함)
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any,
  customerInfo?: any // 고객 정보 추가
): string => {
  const commission = calculateCommission(quoteInfo.price);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + 7);
  
  // 고객 이름
  const customerName = customerInfo 
    ? `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim() || '고객'
    : '고객';
  
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
        .customer-info { background-color: #fff9e6; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 40%; }
        .contact-info { font-size: 16px; font-weight: bold; color: #4A90E2; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 축하합니다!</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트에 선정되셨습니다</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${contractorName}</strong>님</p>
          
          <p>고객님께서 제출하신 견적서가 선택되었음을 기쁘게 알려드립니다.</p>
          
          ${customerInfo ? `
          <div class="customer-info">
            <h3 style="margin-top: 0;">📞 고객 연락처 정보</h3>
            <table class="info-table">
              <tr>
                <td>고객명:</td>
                <td class="contact-info">${customerName}</td>
              </tr>
              ${customerInfo.email ? `
              <tr>
                <td>이메일:</td>
                <td class="contact-info">${customerInfo.email}</td>
              </tr>
              ` : ''}
              ${customerInfo.phone ? `
              <tr>
                <td>전화번호:</td>
                <td class="contact-info">${customerInfo.phone}</td>
              </tr>
              ` : ''}
            </table>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
              <strong>⚠️ 고객님께 직접 연락하여 프로젝트 상세 일정을 조율해주세요.</strong>
            </p>
          </div>
          ` : ''}
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 프로젝트 정보</h3>
            <table class="info-table">
              <tr>
                <td>프로젝트 유형:</td>
                <td>${projectInfo.project_types?.join(', ') || '리모델링'}</td>
              </tr>
              <tr>
                <td>공간 유형:</td>
                <td>${projectInfo.space_type || '주거공간'}</td>
              </tr>
              <tr>
                <td>주소:</td>
                <td>${projectInfo.full_address || '상세 주소는 고객에게 문의'}</td>
              </tr>
              <tr>
                <td>견적 금액:</td>
                <td><strong>$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="highlight" style="background-color: #fff3cd; border-left-color: #ffc107;">
            <h3 style="margin-top: 0;">💰 수수료 안내</h3>
            <table class="info-table">
              <tr>
                <td>예상 수수료:</td>
                <td><strong>${commission}</strong></td>
              </tr>
              <tr>
                <td>수수료율:</td>
                <td>견적 금액의 10%</td>
              </tr>
              <tr>
                <td>지급 예정일:</td>
                <td>${completionDate.toLocaleDateString('ko-KR')}</td>
              </tr>
            </table>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
              * 수수료는 프로젝트 완료 후 7일 이내에 지급됩니다.<br>
              * 실제 수수료는 최종 프로젝트 금액에 따라 조정될 수 있습니다.
            </p>
          </div>
          
          <h3>📌 다음 단계</h3>
          <ol>
            <li><strong>고객님과 직접 연락</strong>하여 상세 일정을 조율해주세요</li>
            <li>현장 방문 일정을 잡고 정확한 견적을 확정해주세요</li>
            <li>계약서 작성 및 서명을 진행해주세요</li>
            <li>프로젝트 진행 상황을 대시보드에서 업데이트해주세요</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              대시보드에서 확인하기
            </a>
          </center>
          
          <p style="margin-top: 30px;">
            프로젝트 진행 중 궁금한 사항이 있으시면 언제든지 문의해주세요.
          </p>
          
          <p>
            감사합니다.<br>
            <strong>Canada Beaver 팀</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>이 이메일은 Canada Beaver Platform에서 자동으로 발송되었습니다.</p>
          <p>문의사항: support@canadabeaver.pro</p>
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
          <h1>✅ 업체 선정 완료</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트를 시작할 준비가 되었습니다</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${customerName}</strong>님</p>
          
          <p>선택하신 업체 정보를 안내드립니다.</p>
          
          <div class="info-box">
            <h3>선정된 업체 정보</h3>
            <p><strong>업체명:</strong> ${contractorInfo.company_name}</p>
            <p><strong>담당자:</strong> ${contractorInfo.contact_name}</p>
            <p><strong>연락처:</strong> ${contractorInfo.phone || '업체에 문의'}</p>
            <p><strong>이메일:</strong> ${contractorInfo.email || '업체에 문의'}</p>
            <p><strong>견적금액:</strong> $${quoteInfo.price?.toLocaleString() || '0'} CAD</p>
          </div>
          
          <p><strong>업체에서 곧 연락드릴 예정입니다.</strong> 프로젝트가 성공적으로 완료되길 바랍니다!</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              내 견적 확인하기
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
