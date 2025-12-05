import { createAdminClient } from '@/lib/supabase/server-clients'
import { NextResponse } from 'next/server'
import { 
  sendEmail, 
  createSelectionEmailTemplate, 
  createCustomerNotificationTemplate,
  getContractorSelectionEmailSubject,
  getCustomerSelectionEmailSubject
} from '@/lib/email/mailgun'
import { determineEmailLanguage } from '@/lib/utils/emailLanguage'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId } = await request.json()
    
    if (!projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing projectId or contractorId' },
        { status: 400 }
      )
    }
    
    // ✅ Admin client 사용 (RLS 우회하여 preferred_language 조회 가능)
    const supabase = createAdminClient()
    
    // 1. 프로젝트 정보 가져오기
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      throw new Error('Project not found')
    }
    
    // 2. 고객 정보 가져오기 (preferred_language + preferred_languages 둘 다 포함!)
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('first_name, last_name, email, phone, preferred_language, preferred_languages')
      .eq('id', project.customer_id)
      .single()
    
    if (customerError || !customer) {
      console.error('❌ Customer fetch error:', customerError)
      throw new Error('Customer not found')
    }
    
    // ✅ 디버깅: 고객 정보 로그
    console.log('👤 Customer info:', {
      customer_id: project.customer_id,
      email: customer.email,
      preferred_language: customer.preferred_language,
      preferred_languages: customer.preferred_languages
    })
    
    // ✅ 고객 언어 설정 - preferred_languages 배열 우선 사용!
    let customerLocale = 'en' // 기본값
    if (customer.preferred_languages && customer.preferred_languages.length > 0) {
      customerLocale = determineEmailLanguage(customer.preferred_languages)
      console.log('📧 Using determineEmailLanguage for customer:', {
        input: customer.preferred_languages,
        result: customerLocale
      })
    } else if (customer.preferred_language) {
      customerLocale = customer.preferred_language
      console.log('📧 Using preferred_language for customer:', customerLocale)
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
    
    console.log('🔍 Contractor info:', {
      contractorId,
      user_id: contractor.user_id,
      company_name: contractor.company_name
    })
    
    // 4. 업체 사용자 정보 가져오기 (이메일 + preferred_language + preferred_languages)
    const { data: contractorUser, error: contractorUserError } = await supabase
      .from('users')
      .select('email, preferred_language, preferred_languages')
      .eq('id', contractor.user_id)
      .single()
    
    // ✅ 디버깅: 업체 사용자 조회 결과 로그
    console.log('🔍 Contractor user lookup:', {
      user_id: contractor.user_id,
      found: !!contractorUser,
      error: contractorUserError?.message || null,
      contractorUser: contractorUser ? {
        email: contractorUser.email,
        preferred_language: contractorUser.preferred_language,
        preferred_languages: contractorUser.preferred_languages
      } : null
    })
    
    const contractorEmail = contractorUser?.email || contractor.email
    
    if (!contractorEmail) {
      throw new Error('Contractor email not found')
    }
    
    // ✅ 업체 언어 설정 - preferred_languages 배열 우선 사용!
    let contractorLocale = 'en' // 기본값
    if (contractorUser?.preferred_languages && contractorUser.preferred_languages.length > 0) {
      contractorLocale = determineEmailLanguage(contractorUser.preferred_languages)
      console.log('📧 Using determineEmailLanguage for contractor:', {
        input: contractorUser.preferred_languages,
        result: contractorLocale
      })
    } else if (contractorUser?.preferred_language) {
      contractorLocale = contractorUser.preferred_language
      console.log('📧 Using preferred_language for contractor:', contractorLocale)
    }
    
    // ✅ 디버깅: 최종 언어 설정 로그
    console.log('🌐 FINAL Language settings:', {
      contractorLocale,
      customerLocale,
      contractorUserPreferredLanguage: contractorUser?.preferred_language,
      contractorUserPreferredLanguages: contractorUser?.preferred_languages,
      customerPreferredLanguage: customer.preferred_language,
      customerPreferredLanguages: customer.preferred_languages
    })
    
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
      contractorLocale,
      customerEmail: customer.email,
      customerLocale,
      projectId,
      contractorId
    })
    
    // 7. 업체에게 해당 언어로 이메일 발송 (고객 정보 포함)
    const contractorEmailResult = await sendEmail({
      to: contractorEmail,
      subject: getContractorSelectionEmailSubject(customerName, contractorLocale),
      html: createSelectionEmailTemplate(
        contractor.company_name,
        project,
        quote,
        customer,
        contractorLocale
      )
    })
    
    if (!contractorEmailResult.success) {
      console.error('❌ Failed to send email to contractor:', contractorEmailResult.error)
    } else {
      console.log('✅ Email sent to contractor:', contractorEmail, 'in', contractorLocale)
    }
    
    // 8. 고객에게 해당 언어로 이메일 발송
    const customerEmailResult = await sendEmail({
      to: customer.email,
      subject: getCustomerSelectionEmailSubject(customerLocale),
      html: createCustomerNotificationTemplate(
        customerName,
        contractor,
        project,
        quote,
        customerLocale
      )
    })
    
    if (!customerEmailResult.success) {
      console.error('❌ Failed to send email to customer:', customerEmailResult.error)
    } else {
      console.log('✅ Email sent to customer:', customer.email, 'in', customerLocale)
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
        contractorLocale,
        customerLocale,
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
