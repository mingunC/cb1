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
          <h1>🎉 축하합니다!</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트에 선정되셨습니다</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${contractorName}</strong>님</p>
          
          <p>제출하신 견적서가 선택되었음을 기쁘게 알려드립니다. 고객님께서 귀사의 견적을 최종 선정하셨습니다.</p>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #333;">📞 고객 연락처 정보</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>고객명</td>
                <td class="contact-info">${customerName}</td>
              </tr>
              ${hasEmail ? `
              <tr>
                <td>이메일</td>
                <td class="contact-info">${customerInfo.email}</td>
              </tr>
              ` : ''}
              ${hasPhone ? `
              <tr>
                <td>전화번호</td>
                <td class="contact-info">${customerInfo.phone}</td>
              </tr>
              ` : `
              <tr>
                <td>전화번호</td>
                <td style="color: #999; font-style: italic;">고객이 전화번호를 제공하지 않았습니다</td>
              </tr>
              `}
            </table>
            ${!hasPhone ? `
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;">
              ⚠️ <strong>안내:</strong> 고객이 전화번호를 미입력했습니다. 이메일로 먼저 연락하시거나, 현장 방문 시 연락처를 확인하시기 바랍니다.
            </div>
            ` : ''}
          </div>
          
          <div class="warning-box">
            <strong>⚠️ 중요 안내</strong>
            <p style="margin: 10px 0 0 0;">고객님께 <strong>가능한 빨리 연락</strong>하여 프로젝트 일정을 조율해주세요. 신속한 응대가 고객 만족도를 높입니다.</p>
          </div>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 프로젝트 정보</h3>
            <table class="info-table">
              <tr>
                <td>프로젝트 유형</td>
                <td>${projectInfo.project_types?.join(', ') || '리모델링'}</td>
              </tr>
              <tr>
                <td>공간 유형</td>
                <td>${projectInfo.space_type || '주거공간'}</td>
              </tr>
              <tr>
                <td>주소</td>
                <td>${projectInfo.full_address || '상세 주소는 고객에게 문의'}</td>
              </tr>
              <tr>
                <td>견적 금액</td>
                <td><strong style="font-size: 18px; color: #4A90E2;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="commission-box">
            <h3 style="margin-top: 0; color: #333;">💰 플랫폼 수수료 안내</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>플랫폼 수수료</td>
                <td><strong style="font-size: 18px; color: #28a745;">${commission}</strong></td>
              </tr>
              <tr>
                <td>수수료율</td>
                <td>견적 금액의 10%<br/><span style="font-size: 13px; color: #666;">(선금5% + 프로젝트 시작후 5%)</span></td>
              </tr>
              <tr>
                <td>지급 기한</td>
                <td>${completionDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>
            <div style="background: #e7f3ff; padding: 12px; border-radius: 5px; margin-top: 15px; font-size: 14px; color: #333;">
              <strong>📌 수수료 정책:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>수수료는 프로젝트 계약 체결 후 7일 이내에 지급해주세요</li>
                <li>최종 프로젝트 금액이 변경될 경우, 변경된 금액 기준으로 수수료가 재계산됩니다</li>
                <li>입금 계좌 정보는 별도로 안내드립니다</li>
              </ul>
            </div>
          </div>
          
          <h3>📌 다음 단계</h3>
          <ol class="steps">
            <li><strong>고객 연락</strong>: ${hasPhone ? '이메일 or 전화로' : '이메일로'} 연락하여 일정 조율</li>
            <li><strong>현장 방문</strong>: 방문 일정을 잡고 상세 견적 확정</li>
            <li><strong>계약 체결</strong>: 계약서 작성 및 서명 진행</li>
            <li><strong>진행 업데이트</strong>: 이메일로 프로젝트 시작일을 캐나다비버에게 알려주세요</li>
            <li><strong>수수료 지급</strong>: 계약 체결 후 7일 이내 플랫폼 수수료 지급</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              대시보드에서 확인하기
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            프로젝트 진행 중 궁금한 사항이 있으시면 언제든지 문의해주세요.
          </p>
          
          <p>
            감사합니다.<br>
            <strong>Canada Beaver 팀</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>이 이메일은 Canada Beaver Platform에서 자동으로 발송되었습니다.</p>
          <p>문의: support@canadabeaver.pro | 웹사이트: www.canadabeaver.pro</p>
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
          <h1>✅ 업체 선정 완료</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트를 시작할 준비가 되었습니다</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${customerName}</strong>님</p>
          
          <div class="success-badge">
            🎉 선택하신 업체가 확정되었습니다!
          </div>
          
          <p>귀하의 프로젝트를 담당할 업체 정보를 안내드립니다.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">🏢 선정된 업체 정보</h3>
            <table class="info-table">
              <tr>
                <td>업체명</td>
                <td><strong>${contractorInfo.company_name}</strong></td>
              </tr>
              <tr>
                <td>담당자</td>
                <td>${contractorInfo.contact_name || contractorInfo.company_name}</td>
              </tr>
              ${contractorInfo.phone ? `
              <tr>
                <td>연락처</td>
                <td><strong>${contractorInfo.phone}</strong></td>
              </tr>
              ` : ''}
              ${contractorInfo.email ? `
              <tr>
                <td>이메일</td>
                <td>${contractorInfo.email}</td>
              </tr>
              ` : ''}
              <tr>
                <td>견적금액</td>
                <td><strong style="color: #28a745; font-size: 18px;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📞 다음 단계:</strong>
            <p style="margin: 10px 0 0 0;">선정된 업체에서 곧 연락드릴 예정입니다. 프로젝트 일정 및 세부 사항을 조율해주세요.</p>
          </div>
          
          <p>프로젝트가 성공적으로 완료되기를 바랍니다!</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              내 견적 확인하기
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            프로젝트 진행 중 문의사항이 있으시면 언제든지 support@canadabeaver.pro로 연락주세요.
          </p>
        </div>
        
        <div class="footer">
          <p>이 이메일은 Canada Beaver Platform에서 자동으로 발송되었습니다.</p>
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
