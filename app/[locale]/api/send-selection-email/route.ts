import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { 
  sendEmail, 
  createSelectionEmailTemplate, 
  createCustomerNotificationTemplate 
} from '@/lib/email/mailgun'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId } = await request.json()
    
    if (!projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing projectId or contractorId' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // 1. 프로젝트 정보 가져오기
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      throw new Error('Project not found')
    }
    
    // 2. 고객 정보 가져오기
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('first_name, last_name, email, phone')
      .eq('id', project.customer_id)
      .single()
    
    if (customerError || !customer) {
      throw new Error('Customer not found')
    }
    
    // 3. 업체 정보 가져오기
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, email, user_id, phone, contact_name')
      .eq('id', contractorId)
      .single()
    
    if (contractorError || !contractor) {
      throw new Error('Contractor not found')
    }
    
    // 4. 업체의 이메일 주소 가져오기 (users 테이블에서)
    const { data: contractorUser, error: contractorUserError } = await supabase
      .from('users')
      .select('email')
      .eq('id', contractor.user_id)
      .single()
    
    const contractorEmail = contractorUser?.email || contractor.email
    
    if (!contractorEmail) {
      throw new Error('Contractor email not found')
    }
    
    // 5. 선택된 견적서 정보 가져오기
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select('price, description')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .eq('status', 'accepted')
      .single()
    
    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError)
      throw new Error('Quote information not found')
    }
    
    // 6. 고객 이름 생성
    const customerName = customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : customer.email?.split('@')[0] || 'Customer'
    
    console.log('📧 Sending emails:', {
      contractorEmail,
      customerEmail: customer.email,
      projectId,
      contractorId
    })
    
    // 7. 업체에게 영어 이메일 발송 (고객 정보 포함)
    const contractorEmailResult = await sendEmail({
      to: contractorEmail,
      subject: `🎉 Congratulations! ${customerName} has selected your company`,
      html: createSelectionEmailTemplate(
        contractor.company_name,
        project,
        quote,
        customer // 고객 정보 전달
      )
    })
    
    if (!contractorEmailResult.success) {
      console.error('❌ Failed to send email to contractor:', contractorEmailResult.error)
    } else {
      console.log('✅ Email sent to contractor:', contractorEmail)
    }
    
    // 8. 고객에게 영어 이메일 발송
    const customerEmailResult = await sendEmail({
      to: customer.email,
      subject: `✅ Contractor Selected for Your Renovation Project`,
      html: createCustomerNotificationTemplate(
        customerName,
        contractor,
        project,
        quote
      )
    })
    
    if (!customerEmailResult.success) {
      console.error('❌ Failed to send email to customer:', customerEmailResult.error)
    } else {
      console.log('✅ Email sent to customer:', customer.email)
    }
    
    // 9. 결과 반환
    const allEmailsSent = contractorEmailResult.success && customerEmailResult.success
    
    return NextResponse.json({
      success: allEmailsSent,
      message: allEmailsSent 
        ? 'Selection emails sent successfully to both contractor and customer'
        : 'Selection confirmed but some emails failed to send',
      details: {
        contractorEmailSent: contractorEmailResult.success,
        customerEmailSent: customerEmailResult.success,
        contractorEmail: contractorEmailResult.success ? contractorEmail : undefined,
        customerEmail: customerEmailResult.success ? customer.email : undefined,
        errors: {
          contractor: contractorEmailResult.error,
          customer: customerEmailResult.error
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error in send-selection-email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send selection emails' },
      { status: 500 }
    )
  }
}
