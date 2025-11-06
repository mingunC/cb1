import { sendEmail, createSelectionEmailTemplate, createCustomerNotificationTemplate } from './email-service';

export interface ContractorSelectionData {
  contractor: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    contact_name: string;
    phone?: string;
  };
  customer: {
    id: string;
    email: string;
    name: string;
  };
  project: {
    id: string;
    project_type?: string;
    space_type?: string;
    address?: string;
  };
  quote: {
    id: string;
    price: number;
  };
}

export const sendContractorSelectionEmails = async (data: ContractorSelectionData) => {
  const results = {
    contractorEmail: { success: false, error: null as string | null },
    customerEmail: { success: false, error: null as string | null }
  };

  try {
    // 업체에게 선정 축하 이메일 발송
    const contractorEmailHTML = createSelectionEmailTemplate(
      data.contractor.name,
      data.project,
      data.quote
    );

    const contractorEmailResult = await sendEmail({
      to: data.contractor.email,
      subject: '🎉 Congratulations! You have been selected for the project',
      html: contractorEmailHTML,
      replyTo: 'support@canadabeaver.pro'
    });

    results.contractorEmail = contractorEmailResult;

    // 고객에게 업체 선정 완료 이메일 발송
    const customerEmailHTML = createCustomerNotificationTemplate(
      data.customer.name,
      data.contractor,
      data.project,
      data.quote
    );

    const customerEmailResult = await sendEmail({
      to: data.customer.email,
      subject: 'contractor selected',
      html: customerEmailHTML,
      replyTo: 'support@canadabeaver.pro'
    });

    results.customerEmail = customerEmailResult;

    console.log('Contractor selection emails sent:', {
      contractor: results.contractorEmail.success,
      customer: results.customerEmail.success,
      contractorMessageId: results.contractorEmail.success ? (results.contractorEmail as any).messageId : null,
      customerMessageId: results.customerEmail.success ? (results.customerEmail as any).messageId : null
    });

    return {
      success: results.contractorEmail.success && results.customerEmail.success,
      results
    };

  } catch (error: any) {
    console.error('Error sending contractor selection emails:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
};

// 단일 이메일 발송 헬퍼 함수들
export const sendContractorSelectionEmail = async (
  contractorEmail: string,
  contractorName: string,
  projectInfo: any,
  quoteInfo: any
) => {
  const emailHTML = createSelectionEmailTemplate(contractorName, projectInfo, quoteInfo);
  
  return await sendEmail({
    to: contractorEmail,
    subject: '🎉 Congratulations! You have been selected for the project',
    html: emailHTML
  });
};

export const sendCustomerNotificationEmail = async (
  customerEmail: string,
  customerName: string,
  contractorInfo: any,
  projectInfo: any,
  quoteInfo: any
) => {
  const emailHTML = createCustomerNotificationTemplate(customerName, contractorInfo, projectInfo, quoteInfo);
  
  return await sendEmail({
    to: customerEmail,
    subject: 'contractor selected',
    html: emailHTML
  });
};
