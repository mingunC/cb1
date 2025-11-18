// 한글 이메일 템플릿 함수들

// 한글로 포맷팅하는 함수들
const formatProjectTypesKo = (projectTypes: string[]): string => {
  const projectTypeMap: { [key: string]: string } = {
    'kitchen': '주방',
    'bathroom': '욕실',
    'basement': '지하실',
    'painting': '페인팅',
    'flooring': '바닥재',
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

const formatSpaceTypeKo = (spaceType: string): string => {
  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': '단독주택',
    'detached_house': '단독주택',
    'condo': '콘도',
    'townhouse': '타운하우스',
    'town_house': '타운하우스',
    'commercial': '상업공간',
    'beecroft': '비크로프트',
    'apartment': '아파트',
    'house': '주택'
  }
  
  return spaceTypeMap[spaceType] || spaceType
}

const formatBudgetKo = (budget: string): string => {
  const budgetMap: { [key: string]: string } = {
    'under_50k': '5만 달러 이하',
    '50k_to_100k': '5만~10만 달러',
    'over_100k': '10만 달러 이상'
  }
  
  return budgetMap[budget] || budget
}

// 수수료 계산 함수
const calculateCommission = (quotePrice: number): { amount: string; rate: string } => {
  let commissionRate: number;
  let rateLabel: string;
  
  if (quotePrice >= 100000) {
    commissionRate = 0.01;
    rateLabel = '1%';
  } else if (quotePrice >= 50000) {
    commissionRate = 0.02;
    rateLabel = '2%';
  } else {
    commissionRate = 0.03;
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

// ✅ 업체에게 보낼 한글 이메일 템플릿 (고객 정보 포함)
export const createSelectionEmailTemplateKo = (
  contractorName: string,
  projectInfo: any,
  quoteInfo: any,
  customerInfo?: any
): string => {
  const commissionInfo = calculateCommission(quoteInfo.price);
  
  const customerName = customerInfo 
    ? `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim() || '고객'
    : '고객';
  
  const hasPhone = customerInfo?.phone && customerInfo.phone.trim() !== '';
  const hasEmail = customerInfo?.email && customerInfo.email.trim() !== '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }
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
          
          <p>귀사께서 제출하신 견적서가 선택되었습니다. 고객께서 귀사의 견적서를 최종 선택하셨습니다.</p>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #333;">📞 고객 연락처 정보</h3>
            <table class="info-table" style="background: white; border-radius: 5px;">
              <tr>
                <td>고객 이름</td>
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
                <td style="color: #999; font-style: italic;">고객님이 전화번호를 입력하지 않으셨습니다.</td>
              </tr>
              `}
            </table>
            ${!hasPhone ? `
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;">
              ⚠️ <strong>안내:</strong> 고객님이 전화번호를 입력하지 않으셨습니다. 먼저 이메일로 연락하시거나, 현장 방문 시 연락처를 확인해주세요.
            </div>
            ` : ''}
          </div>
          
          <div class="warning-box">
            <strong>⚠️ 중요 안내</strong>
            <p style="margin: 10px 0 0 0;"><strong>가능한 빠른 시일 내</strong>에 고객님께 연락하여 프로젝트 일정을 조율해 주세요. 빠른 응답은 고객 만족도를 높입니다.</p>
          </div>
          
          <div class="highlight">
            <h3 style="margin-top: 0;">📋 프로젝트 정보</h3>
            <table class="info-table">
              <tr>
                <td>프로젝트 타입</td>
                <td>${formatProjectTypesKo(projectInfo.project_types || [])}</td>
              </tr>
              <tr>
                <td>공간 타입</td>
                <td>${formatSpaceTypeKo(projectInfo.space_type || '')}</td>
              </tr>
              <tr>
                <td>주소</td>
                <td>${projectInfo.full_address || '상세 주소: 고객에게 문의해주세요.'}</td>
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
                <td><strong style="font-size: 18px; color: #28a745;">${commissionInfo.amount}</strong></td>
              </tr>
              <tr>
                <td>수수료율</td>
                <td>
                    <strong>견적 금액의 1%</strong> : $100,000 이상<br>
                    <strong>견적 금액의 2%</strong> : $50,000 ~ $100,000<br>
                    <strong>견적 금액의 3%</strong> : $50,000 미만
                </td>
              </tr>
              <tr>
                <td>납부 기한</td>
                <td><strong>정책을 참고해주세요</strong></td>
              </tr>
            </table>
            <div style="background: #e7f3ff; padding: 12px; border-radius: 5px; margin-top: 15px; font-size: 14px; color: #333;">
              <strong>📌 수수료 정책:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>프로젝트 계약 체결 후 3일 이내에 수수료를 납부해 주세요.</li>
                <li>최종 프로젝트 금액이 변경될 경우, 변경된 금액 기준으로 수수료가 재계산됩니다.</li>
                <li>입금 계좌 정보는 별도로 제공됩니다.</li>
              </ul>
            </div>
          </div>
          
          <h3>📌 다음 단계</h3>
          <ol class="steps">
            <li><strong>고객 연락</strong>: ${hasPhone ? '이메일 또는 전화로' : '이메일로'} 일정 조율</li>
            <li><strong>현장 방문</strong>: 현장 방문 일정을 잡고 상세 견적 확인</li>
            <li><strong>계약 체결</strong>: 계약서 작성 및 서명</li>
            <li><strong>진행 상황 업데이트</strong>: 프로젝트 시작일을 Canada Beaver에 이메일로 전달</li>
            <li><strong>수수료 납부</strong>: 계약 체결 후 3일 이내에 플랫폼 수수료 납부</li>
          </ol>
          
          <center>
            <a href="https://canadabeaver.pro/contractor" class="button">
              대시보드에서 확인하기
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            프로젝트 진행 중 문의사항이 있으시면 언제든지 연락해 주세요.
          </p>
          
          <p>
            감사합니다.<br>
            <strong>Canada Beaver 팀</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>본 이메일은 Canada Beaver 플랫폼에서 자동 발송되었습니다.</p>
          <p>문의: admin@canadabeaver.pro | 웹사이트: www.canadabeaver.pro</p>
          <p>© 2025 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ 고객에게 보낼 한글 이메일 템플릿
export const createCustomerNotificationTemplateKo = (
  customerName: string,
  contractorInfo: any,
  projectInfo: any,
  quoteInfo: any
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }
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
          <h1>업체가 선정되었습니다</h1>
          <p style="margin: 0; font-size: 18px;">프로젝트 진행 준비 완료</p>
        </div>
        
        <div class="content">
          <p>안녕하세요, <strong>${customerName}</strong>님</p>
          
          <div class="success-badge">
            🎉 선택하신 업체가 확정되었습니다!
          </div>
          
          <p>고객님께서 선택하신 업체가 확정되어 알려드립니다.</p>
          
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
                <td>전화번호</td>
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
                <td>견적 금액</td>
                <td><strong style="color: #28a745; font-size: 18px;">$${quoteInfo.price?.toLocaleString() || '0'} CAD</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📞 다음 단계:</strong>
            <p style="margin: 10px 0 0 0;">선정된 업체에서 곧 연락드려 프로젝트 일정 및 세부 사항을 조율할 예정입니다.</p>
          </div>
          
          <p>프로젝트가 성공적으로 완료되기를 바랍니다!</p>
          
          <center>
            <a href="https://canadabeaver.pro/my-quotes" class="button">
              내 견적서 확인하기
            </a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
            프로젝트 진행 중 문의사항이 있으시면 언제든지 admin@canadabeaver.pro로 연락해 주세요.
          </p>
        </div>
        
        <div class="footer">
          <p>본 이메일은 Canada Beaver 플랫폼에서 자동 발송되었습니다.</p>
          <p>© 2025 Canada Beaver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
