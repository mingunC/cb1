import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { emailTranslations } from './email-translations';

// 디버깅을 위한 로그 추가
if (process.env.NODE_ENV === 'development') console.log('Mailgun Config:', {
  hasApiKey: !!process.env.MAILGUN_API_KEY,
  apiKeyLength: process.env.MAILGUN_API_KEY?.length,
  domain: process.env.MAILGUN_DOMAIN,
  url: process.env.MAILGUN_DOMAIN_URL
});

// Mailgun 초기화
const mailgun = new Mailgun(formData);

const mailgunDomainUrl = process.env.MAILGUN_DOMAIN_URL;

if (!mailgunDomainUrl && process.env.NODE_ENV === 'development') {
  console.warn('MAILGUN_DOMAIN_URL is not set. Mailgun client will fail to send requests.');
}

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: mailgunDomainUrl || ''
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// locale 검증 헬퍼 함수
const getValidLocale = (locale: string = 'en'): 'en' | 'ko' | 'zh' => {
  const supportedLocales = ['en', 'ko', 'zh'];
  return supportedLocales.includes(locale) ? locale as 'en' | 'ko' | 'zh' : 'en';
};

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
    if (!process.env.EMAIL_FROM_NAME || !process.env.EMAIL_FROM_ADDRESS) {
      console.error('Email sender identity is not configured');
      return { success: false, error: 'Email sender not configured' };
    }

    const messageData = {
      from: options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      'h:Reply-To': options.replyTo || process.env.EMAIL_REPLY_TO
    };

    if (process.env.NODE_ENV === 'development') console.log('Attempting to send email with:', {
      from: messageData.from,
      to: messageData.to,
      subject: messageData.subject,
      domain: process.env.MAILGUN_DOMAIN
    });

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    
    if (process.env.NODE_ENV === 'development') console.log('✅ Email sent successfully:', response.id);
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

// ✅ 수수료 계산 함수 - 견적 금액에 따라 1%, 2%, 3% 차등 적용
export const calculateCommission = (quotePrice: number): { amount: string; rate: string } => {
  let commissionRate: number;
  let rateLabel: string;
  
  if (quotePrice >= 100000) {
    commissionRate = 0.01; // 1%
    rateLabel = '1%';
  } else if (quotePrice >= 50000) {
    commissionRate = 0.02; // 2%
    rateLabel = '2%';
  } else {
    commissionRate = 0.03; // 3%
    rateLabel = '3%';
  }
  
  const commission = quotePrice * commissionRate;
  const formattedAmount = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(commission);
  
  return {
    amount: formattedAmount,
    rate: rateLabel
  };
};

// ✅ 영어로 포맷팅하는 함수들
const formatProjectTypes = (projectTypes: string[]): string => {
  const projectTypeMap: { [key: string]: string } = {
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'basement': 'Basement',
    'painting': 'Painting',
    'flooring': 'Flooring',
    'full-renovation': 'Full Renovation',
    'full_renovation': 'Full Renovation',
    'restaurant': 'Restaurant',
    'retail': 'Retail',
    'office': 'Office',
    'education': 'Education Facility',
    'other': 'Other'
  }
  
  return projectTypes.map(type => projectTypeMap[type] || type).join(', ')
}

const formatSpaceType = (spaceType: string): string => {
  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': 'Detached house',
    'detached_house': 'Detached house',
    'condo': 'Condo',
    'townhouse': 'Town house',
    'town_house': 'Town house',
    'commercial': 'Commercial',
    'beecroft': 'Beecroft',
    'apartment': 'Apartment',
    'house': 'House'
  }
  
  return spaceTypeMap[spaceType] || spaceType
}

const formatBudget = (budget: string): string => {
  const budgetMap: { [key: string]: string } = {
    'under_50k': 'under 50k',
    '50k_to_100k': '50k to 100k',
    'over_100k': 'over 100k'
  }
  
  return budgetMap[budget] || budget
}

// ✅ 업체에게 보낼 이메일 템플릿 (고객 정보 포함, 다국어 지원)
export const createSelectionEmailTemplate = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any,
  customerInfo?: any,
  locale: string = 'en'
): string => {
  const validLocale = getValidLocale(locale);
  const t = emailTranslations[validLocale].contractor;
  const common = emailTranslations[validLocale].common;
  
  const commissionInfo = calculateCommission(quoteInfo.price);
  
  // 고객 이름
  const customerName = customerInfo 
    ? `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim() || 'Customer'
    : 'Customer';
  
  // 고객 전화번호 (있는 경우에만 표시)
  const hasPhone = customerInfo?.phone && customerInfo.phone.trim() !== '';
  const hasEmail = customerInfo?.email && customerInfo.email.trim() !== '';
  
  const greeting = typeof t.greeting === 'function' ? t.greeting(contractorName) : t.greeting;
  const steps = typeof t.steps === 'function' ? t.steps(hasPhone) : t.steps;
  
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
          <h1>${t.title}</h1>
          <p style="margin: 0; font-size: 18px;">${t.subtitle}</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          
          <p>${t.intro}</p>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #333;">${t.customerContact}</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>${t.customerName}</td>
                <td class="contact-info">${customerName}</td>
              </tr>
              ${hasEmail ? `
              <tr>
                <td>${t.email}</td>
                <td class="contact-info">${customerInfo.email}</td>
              </tr>
              ` : ''}
              ${hasPhone ? `
              <tr>
                <td>${t.phone}</td>
                <td class="contact-info">${customerInfo.phone}</td>
              </tr>
              ` : `
              <tr>
                <td>${t.phone}</td>
                <td style="color: #999; font-style: italic;">${t.phoneNotProvided}</td>
              </tr>
              `}
            </table>
            ${!hasPhone ? `
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;">
              ${t.phoneNotice}
            </div>
            ` : ''}
          </div>
          
          <div class="warning-box">
            <strong>${t.importantNotice}</strong>
            <p style="margin: 10px 0 0 0;">${t.noticeText}</p>
          </div>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">${t.projectInfo}</h3>
            <table class="info-table">
              <tr>
                <td>${t.projectType}</td>
                <td>${formatProjectTypes(projectInfo.project_types || [])}</td>
              </tr>
              <tr>
                <td>${t.propertyType}</td>
                <td>${formatSpaceType(projectInfo.space_type || '')}</td>
              </tr>
              <tr>
                <td>${t.address}</td>
                <td>${projectInfo.full_address || t.addressInquiry}</td>
              </tr>
              <tr>
                <td>${t.quoteAmount}</td>
                <td><strong style="font-size: 18px; color: #4A90E2;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="commission-box">
            <h3 style="margin-top: 0; color: #333;">${t.commissionInfo}</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>${t.platformCommission}</td>
                <td><strong style="font-size: 18px; color: #28a745;">${commissionInfo.amount}</strong></td>
              </tr>
              <tr>
                <td>${t.commissionRate}</td>
                <td>
                    <strong>${t.commissionRateDesc1}</strong> : $100,000+<br>
                    <strong>${t.commissionRateDesc2}</strong> : $50,000 - $100,000<br>
                    <strong>${t.commissionRateDesc3}</strong> : Under $50,000
                </td>
              </tr>
              <tr>
                <td>${t.paymentDueDate}</td>
                <td><strong>${t.paymentPolicy}</strong></td>
              </tr>
            </table>
            <div style="background: #e7f3ff; padding: 12px; border-radius: 5px; margin-top: 15px; font-size: 14px; color: #333;">
              <strong>${t.commissionPolicy}</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                ${t.policyItems.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
          
          <h3>${t.nextSteps}</h3>
          <ol class="steps">
            ${steps.map((step: string) => `<li>${step}</li>`).join('')}
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              ${t.checkDashboard}
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            ${t.contactUs}
          </p>
          
          <p>
            ${t.thanks}<br>
            <strong>${t.team}</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>${common.autoSent}</p>
          <p>${common.contact}</p>
          <p>${common.copyright}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ 고객에게 보낼 업체 선정 알림 이메일 템플릿 (다국어 지원)
export const createCustomerNotificationTemplate = (
  customerName: string,
  contractorInfo: any,
  projectInfo: any,
  quoteInfo: any,
  locale: string = 'en'
): string => {
  const validLocale = getValidLocale(locale);
  const t = emailTranslations[validLocale].customer;
  const common = emailTranslations[validLocale].common;
  
  const greeting = typeof t.greeting === 'function' ? t.greeting(customerName) : t.greeting;
  
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
          <h1>${t.title}</h1>
          <p style="margin: 0; font-size: 18px;">${t.subtitle}</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          
          <div class="success-badge">
            ${t.successBadge}
          </div>
          
          <p>${t.intro}</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">${t.selectedContractor}</h3>
            <table class="info-table">
              <tr>
                <td>${t.contractorName}</td>
                <td><strong>${contractorInfo.company_name}</strong></td>
              </tr>
              <tr>
                <td>${t.contactName}</td>
                <td>${contractorInfo.contact_name || contractorInfo.company_name}</td>
              </tr>
              ${contractorInfo.phone ? `
              <tr>
                <td>${t.phoneNumber}</td>
                <td><strong>${contractorInfo.phone}</strong></td>
              </tr>
              ` : ''}
              ${contractorInfo.email ? `
              <tr>
                <td>${t.email}</td>
                <td>${contractorInfo.email}</td>
              </tr>
              ` : ''}
              <tr>
                <td>${t.quoteAmount}</td>
                <td><strong style="color: #28a745; font-size: 18px;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>${t.nextSteps}</strong>
            <p style="margin: 10px 0 0 0;">${t.nextStepsText}</p>
          </div>
          
          <p>${t.hopeful}</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              ${t.checkMyQuotes}
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            ${t.contactText}
          </p>
        </div>
        
        <div class="footer">
          <p>${common.autoSent}</p>
          <p>${common.copyright}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ 고객에게 보낼 사이트 방문 신청 알림 이메일 템플릿 (다국어 지원)
export const createSiteVisitApplicationTemplate = (
  customerName: string,
  contractorInfo: {
    company_name: string;
    email?: string;
    phone?: string;
  },
  projectInfo: {
    full_address?: string;
    space_type?: string;
    budget?: string;
  },
  locale: string = 'en'
): string => {
  const validLocale = getValidLocale(locale);
  const t = emailTranslations[validLocale].siteVisit;
  const common = emailTranslations[validLocale].common;
  
  const greeting = typeof t.greeting === 'function' ? t.greeting(customerName) : t.greeting;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .info-table td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 35%; color: #555; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight-box { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.title}</h1>
          <p style="margin: 0; font-size: 18px;">${t.subtitle}</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          
          <p>${t.intro}</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #4A90E2;">${t.contractorInfo}</h3>
            <table class="info-table">
              <tr>
                <td>${t.companyName}</td>
                <td><strong>${contractorInfo.company_name}</strong></td>
              </tr>
              ${contractorInfo.email ? `
              <tr>
                <td>${t.email}</td>
                <td>${contractorInfo.email}</td>
              </tr>
              ` : ''}
              ${contractorInfo.phone ? `
              <tr>
                <td>${t.phone}</td>
                <td>${contractorInfo.phone}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="highlight-box">
            <strong>${t.nextStepsTitle}</strong>
            <p style="margin: 10px 0 0 0;">${t.nextStepsText}</p>
          </div>
          
          <p>${t.thanks}</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              ${t.viewProjects}
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            ${t.contactText}
          </p>
        </div>
        
        <div class="footer">
          <p>${common.autoSent}</p>
          <p>${common.copyright}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ 사이트 방문 신청 이메일 subject 가져오기 (다국어)
export const getSiteVisitEmailSubject = (locale: string = 'en'): string => {
  const validLocale = getValidLocale(locale);
  return emailTranslations[validLocale].siteVisit.subject;
};

// ✅ 고객에게 보낼 견적서 제출 알림 이메일 템플릿 (다국어 지원)
export const createQuoteSubmissionTemplate = (
  customerName: string,
  contractorInfo: {
    company_name: string;
    email?: string;
    phone?: string;
  },
  projectInfo: {
    full_address?: string;
    space_type?: string;
    budget?: string;
  },
  quoteInfo: {
    price: number;
    description?: string;
  },
  locale: string = 'en'
): string => {
  const validLocale = getValidLocale(locale);
  const t = emailTranslations[validLocale].quoteSubmission;
  const common = emailTranslations[validLocale].common;
  
  const greeting = typeof t.greeting === 'function' ? t.greeting(customerName) : t.greeting;
  
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
        .info-table td:first-child { font-weight: bold; width: 35%; color: #555; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight-box { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 5px; }
        .pdf-notice { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
        .price-highlight { font-size: 24px; font-weight: bold; color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.title}</h1>
          <p style="margin: 0; font-size: 18px;">${t.subtitle}</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          
          <p>${t.intro}</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">${t.contractorInfo}</h3>
            <table class="info-table">
              <tr>
                <td>${t.companyName}</td>
                <td><strong>${contractorInfo.company_name}</strong></td>
              </tr>
              ${contractorInfo.email ? `
              <tr>
                <td>${t.email}</td>
                <td>${contractorInfo.email}</td>
              </tr>
              ` : ''}
              ${contractorInfo.phone ? `
              <tr>
                <td>${t.phone}</td>
                <td>${contractorInfo.phone}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">${t.quoteDetails}</h3>
            <table class="info-table">
              <tr>
                <td>${t.quoteAmount}</td>
                <td class="price-highlight">$${quoteInfo.price.toLocaleString()} CAD</td>
              </tr>
              ${quoteInfo.description ? `
              <tr>
                <td>${t.description}</td>
                <td>${quoteInfo.description}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="pdf-notice">
            <strong>${t.pdfNotice}</strong>
            <p style="margin: 10px 0 0 0;">${t.pdfNoticeText}</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">${t.projectDetails}</h3>
            <table class="info-table">
              <tr>
                <td>${t.address}</td>
                <td>${projectInfo.full_address || t.notSpecified}</td>
              </tr>
              <tr>
                <td>${t.spaceType}</td>
                <td>${formatSpaceType(projectInfo.space_type || '')}</td>
              </tr>
              ${projectInfo.budget ? `
              <tr>
                <td>${t.budget}</td>
                <td>${formatBudget(projectInfo.budget)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="highlight-box">
            <strong>${t.nextStepsTitle}</strong>
            <p style="margin: 10px 0 0 0;">${t.nextStepsText}</p>
          </div>
          
          <p>${t.thanks}</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              ${t.viewAllQuotes}
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            ${t.contactText}
          </p>
        </div>
        
        <div class="footer">
          <p>${common.autoSent}</p>
          <p>${common.copyright}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ 견적서 제출 이메일 subject 가져오기 (다국어)
export const getQuoteSubmissionEmailSubject = (locale: string = 'en'): string => {
  const validLocale = getValidLocale(locale);
  return emailTranslations[validLocale].quoteSubmission.subject;
};

// ✅ 업체 선정 이메일 subject 가져오기 (다국어) - 업체용
export const getContractorSelectionEmailSubject = (customerName: string, locale: string = 'en'): string => {
  const validLocale = getValidLocale(locale);
  const subjectFn = emailTranslations[validLocale].contractor.subject;
  return typeof subjectFn === 'function' ? subjectFn(customerName) : subjectFn;
};

// ✅ 업체 선정 이메일 subject 가져오기 (다국어) - 고객용
export const getCustomerSelectionEmailSubject = (locale: string = 'en'): string => {
  const validLocale = getValidLocale(locale);
  return emailTranslations[validLocale].customer.subject;
};

// API 키 검증 함수 (테스트용)
export const verifyMailgunConfig = async () => {
  try {
    if (process.env.NODE_ENV === 'development') console.log('Verifying Mailgun configuration...');
    
    // 도메인 정보 가져오기 테스트
    const domain = await mg.domains.get(process.env.MAILGUN_DOMAIN!);
    
    if (process.env.NODE_ENV === 'development') console.log('Mailgun domain verified:', {
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
