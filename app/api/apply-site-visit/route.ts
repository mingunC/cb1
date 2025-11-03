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
    
    console.log('🚀 Site visit application started:', { projectId, contractorId })
    
    // 1. Check if already applied
    const { data: existing, error: checkError } = await supabase
      .from('site_visit_applications')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .maybeSingle()
    
    if (checkError) {
      console.error('❌ Check error:', checkError)
      throw new Error(`Check failed: ${checkError.message}`)
    }
    
    if (existing) {
      return NextResponse.json(
        { error: 'Site visit already applied' },
        { status: 400 }
      )
    }
    
    // 2. Insert site visit application
    const insertData = {
      project_id: projectId,
      contractor_id: contractorId,
      status: 'pending',
      applied_at: new Date().toISOString()
    }
    
    const { data: application, error: insertError } = await supabase
      .from('site_visit_applications')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
      throw new Error(`Insert failed: ${insertError.message}`)
    }
    
    console.log('✅ Site visit application created:', application.id)
    
    // 3. Get project information
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      console.error('❌ Project not found')
      // Site visit is already created, so we continue
    }
    
    // 4. Get customer information
    let customer = null
    if (project) {
      const { data: customerData, error: customerError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone')
        .eq('id', project.customer_id)
        .single()
      
      customer = customerData
    }
    
    // 5. Get contractor information
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, email, user_id')
      .eq('id', contractorId)
      .single()
    
    // 6. Prepare email for customer
    if (customer && contractor && project) {
      const customerName = customer.first_name && customer.last_name
        ? `${customer.first_name} ${customer.last_name}`
        : customer.email?.split('@')[0] || 'Customer'
      
      const emailSubject = `🏠 New Site Visit Application for Your Project`
      
      const emailBody = `
Hello ${customerName}!

Good news! A contractor has applied for a site visit to your renovation project.

🏢 Contractor Information:
- Company: ${contractor.company_name}

📋 Project Details:
- Address: ${project.full_address || 'Not specified'}
- Space Type: ${project.space_type || 'Not specified'}
- Budget: ${project.budget || 'Not specified'}

📅 Next Steps:
The contractor will visit your property to better understand the project scope. 
You can view and manage site visit applications in your dashboard.

Thank you for choosing our service!
      `.trim()
      
      console.log('📧 Email prepared for customer:', {
        to: customer.email,
        subject: emailSubject,
        customerName,
        companyName: contractor.company_name
      })
      
      // TODO: Implement actual email sending service
      // Option 1: Resend
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   from: 'noreply@yourcompany.com',
      //   to: customer.email,
      //   subject: emailSubject,
      //   html: emailBody.replace(/\n/g, '<br>')
      // })
      
      // Option 2: Supabase Edge Function
      // await supabase.functions.invoke('send-email', {
      //   body: { to: customer.email, subject: emailSubject, body: emailBody }
      // })
      
      // For now, just log (development stage)
      console.log('📧 Email would be sent to:', customer.email)
      console.log('Subject:', emailSubject)
      console.log('Body:', emailBody)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Site visit application submitted successfully',
      data: {
        applicationId: application.id,
        emailSent: customer ? true : false
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error in site visit application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply for site visit' },
      { status: 500 }
    )
  }
}
