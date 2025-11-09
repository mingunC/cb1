import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      .select('company_name, email, user_id')
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
    
    // 5. 이메일 내용 준비
    const customerName = customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : customer.email?.split('@')[0] || '고객'
    
    const emailSubject = `🎉 축하합니다! ${customerName}님이 귀사를 선택했습니다`
    
    const emailBody = `
안녕하세요, ${contractor.company_name}님!

축하합니다! 고객께서 귀사를 프로젝트 업체로 선택하셨습니다.

📋 프로젝트 정보:
- 주소: ${project.full_address || '정보 없음'}
- 공간 타입: ${project.space_type || '정보 없음'}
- 예산: ${project.budget || '정보 없음'}

👤 고객 정보:
- 이름: ${customerName}
- 이메일: ${customer.email || '정보 없음'}
- 연락처: ${customer.phone || '정보 없음'}
- 주소: ${project.full_address || '정보 없음'}

고객님께 연락하여 프로젝트를 진행해주세요!

감사합니다.
    `.trim()
    
    if (process.env.NODE_ENV === 'development') console.log('📧 Email prepared:', {
      to: contractorEmail,
      subject: emailSubject,
      customerName,
      companyName: contractor.company_name
    })
    
    // TODO: 실제 이메일 발송 서비스 통합
    // 옵션 1: Resend
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@yourcompany.com',
    //   to: contractorEmail,
    //   subject: emailSubject,
    //   html: emailBody.replace(/\n/g, '<br>')
    // })
    
    // 옵션 2: Supabase Edge Function
    // await supabase.functions.invoke('send-email', {
    //   body: { to: contractorEmail, subject: emailSubject, body: emailBody }
    // })
    
    // 옵션 3: SendGrid, Mailgun 등
    
    // 현재는 로그만 출력 (개발 단계)
    if (process.env.NODE_ENV === 'development') console.log('📧 Email would be sent to:', contractorEmail)
    if (process.env.NODE_ENV === 'development') console.log('Subject:', emailSubject)
    if (process.env.NODE_ENV === 'development') console.log('Body:', emailBody)
    
    return NextResponse.json({
      success: true,
      message: 'Email notification prepared',
      preview: {
        to: contractorEmail,
        subject: emailSubject,
        customerInfo: {
          name: customerName,
          email: customer.email,
          phone: customer.phone
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error sending selection email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
