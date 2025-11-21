// 다국어 이메일 템플릿

export const emailTranslations = {
  en: {
    contractor: {
      subject: (customerName: string) => `🎉 Congratulations! ${customerName} has selected your company`,
      title: '🎉 Congratulations!',
      subtitle: "You've been selected for the project",
      greeting: (name: string) => `Hello, <strong>${name}</strong>`,
      intro: "We are pleased to inform you that the quotation you submitted has been selected. The customer has finally chosen your company's quotation.",
      customerContact: '📞 Customer Contact Information',
      customerName: 'Customer Name',
      email: 'Email',
      phone: 'Phone Number',
      phoneNotProvided: 'The customer did not provide a phone number.',
      phoneNotice: '⚠️ <strong>Notice:</strong> The customer did not enter a phone number. Please contact them via email first, or confirm their contact details during the on-site visit.',
      importantNotice: '⚠️ Important Notice',
      noticeText: 'Please contact the customer <strong>as soon as possible</strong> to coordinate the project schedule. Prompt response enhances customer satisfaction.',
      projectInfo: '📋 Project Information',
      projectType: 'Project Type',
      propertyType: 'Property Type',
      address: 'Address',
      addressInquiry: 'Detailed address: Please inquire with the customer.',
      quoteAmount: 'Quotation Amount',
      commissionInfo: '💰 Platform Commission Information',
      platformCommission: 'Platform Commission',
      commissionRate: 'Commission Rate',
      paymentDueDate: 'Payment Due Date',
      paymentPolicy: 'Please refer to the Policy',
      commissionPolicy: '📌 Commission Policy:',
      policyItems: [
        'Please pay the commission within 3 days after the project contract is signed.',
        'If the final project amount changes, the commission will be recalculated based on the changed amount.',
        'Deposit account information will be provided separately.'
      ],
      nextSteps: '📌 Next Steps',
      steps: (hasPhone: boolean) => [
        `<strong>Contact the Customer</strong>: ${hasPhone ? 'Email or phone' : 'Email'} to coordinate the schedule`,
        '<strong>Site Visit</strong>: Schedule a visit and confirm the detailed quotation',
        '<strong>Contract Signing</strong>: Write and sign the contract',
        '<strong>Progress Update</strong>: Email the start date of the project to Canada Beaver',
        '<strong>Commission Payment</strong>: Pay the platform commission within 3 days after the contract is signed'
      ],
      checkDashboard: 'Check in Dashboard',
      contactUs: 'If you have any questions during the project, please contact us anytime.',
      thanks: 'Thank you.',
      team: 'Canada Beaver Team'
    },
    customer: {
      subject: '✅ Contractor Selected for Your Renovation Project',
      title: 'Contractor Selected',
      subtitle: 'The project is ready to start',
      greeting: (name: string) => `Hello, <strong>${name}</strong>`,
      successBadge: '🎉 The contractor you selected has been confirmed!',
      intro: 'We are pleased to inform you that the contractor you selected has been confirmed.',
      selectedContractor: '🏢 Selected Contractor Information',
      contractorName: 'Contractor Name',
      contactName: 'Contact Name',
      phoneNumber: 'Phone Number',
      email: 'Email',
      quoteAmount: 'Quotation Amount',
      nextSteps: '📞 Next Steps:',
      nextStepsText: 'The selected contractor will contact you soon to coordinate the project schedule and details.',
      hopeful: 'We hope the project is successful!',
      checkMyQuotes: 'Check My Quotes',
      contactText: 'If you have any questions during the project, please contact us anytime at support@canadabeaver.pro.'
    },
    common: {
      autoSent: 'This email was automatically sent by the Canada Beaver Platform.',
      copyright: '© 2025 Canada Beaver. All rights reserved.',
      contact: 'Contact: support@canadabeaver.pro | Website: www.canadabeaver.pro'
    }
  },
  ko: {
    contractor: {
      subject: (customerName: string) => `🎉 축하합니다! ${customerName}님이 귀사를 선택했습니다`,
      title: '🎉 축하합니다!',
      subtitle: '프로젝트에 선정되셨습니다',
      greeting: (name: string) => `안녕하세요, <strong>${name}</strong>님`,
      intro: '제출하신 견적서가 선정되었음을 알려드립니다. 고객님께서 최종적으로 귀사의 견적을 선택하셨습니다.',
      customerContact: '📞 고객 연락처 정보',
      customerName: '고객 이름',
      email: '이메일',
      phone: '전화번호',
      phoneNotProvided: '고객이 전화번호를 제공하지 않았습니다.',
      phoneNotice: '⚠️ <strong>안내:</strong> 고객이 전화번호를 입력하지 않았습니다. 먼저 이메일로 연락하시거나, 현장 방문 시 연락처를 확인해주세요.',
      importantNotice: '⚠️ 중요 안내',
      noticeText: '프로젝트 일정 조율을 위해 <strong>최대한 빨리</strong> 고객에게 연락해주세요. 신속한 응대가 고객 만족도를 높입니다.',
      projectInfo: '📋 프로젝트 정보',
      projectType: '프로젝트 유형',
      propertyType: '물건 유형',
      address: '주소',
      addressInquiry: '상세 주소: 고객에게 문의하세요.',
      quoteAmount: '견적 금액',
      commissionInfo: '💰 플랫폼 수수료 정보',
      platformCommission: '플랫폼 수수료',
      commissionRate: '수수료율',
      paymentDueDate: '납부 기한',
      paymentPolicy: '정책 참조',
      commissionPolicy: '📌 수수료 정책:',
      policyItems: [
        '프로젝트 계약 체결 후 3일 이내에 수수료를 납부해주세요.',
        '최종 프로젝트 금액이 변경되면, 변경된 금액을 기준으로 수수료가 재계산됩니다.',
        '입금 계좌 정보는 별도로 제공됩니다.'
      ],
      nextSteps: '📌 다음 단계',
      steps: (hasPhone: boolean) => [
        `<strong>고객 연락</strong>: ${hasPhone ? '이메일 또는 전화로' : '이메일로'} 일정 조율`,
        '<strong>현장 방문</strong>: 방문 일정을 잡고 상세 견적 확인',
        '<strong>계약 체결</strong>: 계약서 작성 및 서명',
        '<strong>진행 상황 업데이트</strong>: Canada Beaver에 프로젝트 시작 날짜 이메일 전송',
        '<strong>수수료 납부</strong>: 계약 체결 후 3일 이내에 플랫폼 수수료 납부'
      ],
      checkDashboard: '대시보드에서 확인하기',
      contactUs: '프로젝트 진행 중 질문이 있으시면 언제든 연락주세요.',
      thanks: '감사합니다.',
      team: 'Canada Beaver 팀'
    },
    customer: {
      subject: '✅ 리노베이션 프로젝트 업체 선정 완료',
      title: '업체 선정 완료',
      subtitle: '프로젝트 시작 준비 완료',
      greeting: (name: string) => `안녕하세요, <strong>${name}</strong>님`,
      successBadge: '🎉 선택하신 업체가 확정되었습니다!',
      intro: '선택하신 업체가 확정되었음을 알려드립니다.',
      selectedContractor: '🏢 선정된 업체 정보',
      contractorName: '업체명',
      contactName: '담당자명',
      phoneNumber: '전화번호',
      email: '이메일',
      quoteAmount: '견적 금액',
      nextSteps: '📞 다음 단계:',
      nextStepsText: '선정된 업체가 곧 연락드려 프로젝트 일정과 세부사항을 조율할 예정입니다.',
      hopeful: '프로젝트가 성공적으로 진행되길 바랍니다!',
      checkMyQuotes: '내 견적 확인하기',
      contactText: '프로젝트 진행 중 궁금한 사항이 있으시면 언제든 support@canadabeaver.pro로 문의해주세요.'
    },
    common: {
      autoSent: '이 이메일은 Canada Beaver 플랫폼에서 자동으로 발송되었습니다.',
      copyright: '© 2025 Canada Beaver. All rights reserved.',
      contact: '문의: support@canadabeaver.pro | 웹사이트: www.canadabeaver.pro'
    }
  },
  zh: {
    contractor: {
      subject: (customerName: string) => `🎉 恭喜！${customerName}选择了您的公司`,
      title: '🎉 恭喜！',
      subtitle: '您被选中参与项目',
      greeting: (name: string) => `您好，<strong>${name}</strong>`,
      intro: '很高兴通知您，您提交的报价已被选中。客户最终选择了贵公司的报价。',
      customerContact: '📞 客户联系信息',
      customerName: '客户姓名',
      email: '电子邮件',
      phone: '电话号码',
      phoneNotProvided: '客户未提供电话号码。',
      phoneNotice: '⚠️ <strong>注意：</strong>客户未输入电话号码。请先通过电子邮件联系，或在现场访问时确认联系方式。',
      importantNotice: '⚠️ 重要提示',
      noticeText: '请<strong>尽快</strong>联系客户以协调项目时间表。及时响应可提高客户满意度。',
      projectInfo: '📋 项目信息',
      projectType: '项目类型',
      propertyType: '物业类型',
      address: '地址',
      addressInquiry: '详细地址：请向客户咨询。',
      quoteAmount: '报价金额',
      commissionInfo: '💰 平台佣金信息',
      platformCommission: '平台佣金',
      commissionRate: '佣金率',
      paymentDueDate: '付款期限',
      paymentPolicy: '请参考政策',
      commissionPolicy: '📌 佣金政策：',
      policyItems: [
        '请在项目合同签订后3天内支付佣金。',
        '如果最终项目金额发生变化，佣金将根据变更后的金额重新计算。',
        '存款账户信息将另行提供。'
      ],
      nextSteps: '📌 后续步骤',
      steps: (hasPhone: boolean) => [
        `<strong>联系客户</strong>：通过${hasPhone ? '电子邮件或电话' : '电子邮件'}协调时间表`,
        '<strong>现场访问</strong>：安排访问并确认详细报价',
        '<strong>签订合同</strong>：撰写并签署合同',
        '<strong>进度更新</strong>：将项目开始日期通过电子邮件发送给Canada Beaver',
        '<strong>佣金支付</strong>：在合同签订后3天内支付平台佣金'
      ],
      checkDashboard: '在仪表板中查看',
      contactUs: '如果在项目期间有任何问题，请随时与我们联系。',
      thanks: '谢谢。',
      team: 'Canada Beaver团队'
    },
    customer: {
      subject: '✅ 已为您的翻新项目选择承包商',
      title: '承包商已选定',
      subtitle: '项目准备就绪',
      greeting: (name: string) => `您好，<strong>${name}</strong>`,
      successBadge: '🎉 您选择的承包商已确认！',
      intro: '很高兴通知您，您选择的承包商已确认。',
      selectedContractor: '🏢 选定的承包商信息',
      contractorName: '承包商名称',
      contactName: '联系人姓名',
      phoneNumber: '电话号码',
      email: '电子邮件',
      quoteAmount: '报价金额',
      nextSteps: '📞 后续步骤：',
      nextStepsText: '选定的承包商将很快与您联系，协调项目时间表和细节。',
      hopeful: '我们希望项目顺利进行！',
      checkMyQuotes: '查看我的报价',
      contactText: '如果在项目期间有任何问题，请随时通过support@canadabeaver.pro与我们联系。'
    },
    common: {
      autoSent: '此电子邮件由Canada Beaver平台自动发送。',
      copyright: '© 2025 Canada Beaver. 保留所有权利。',
      contact: '联系方式：support@canadabeaver.pro | 网站：www.canadabeaver.pro'
    }
  }
}

// Helper function to get translation
export const getEmailTranslation = (locale: string, path: string): any => {
  const keys = path.split('.')
  let result: any = emailTranslations[locale as keyof typeof emailTranslations] || emailTranslations.en
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return undefined
    }
  }
  
  return result
}
