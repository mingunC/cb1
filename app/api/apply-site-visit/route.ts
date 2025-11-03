import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, createSiteVisitNotificationTemplate } from '@/lib/email-service-english'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId, notes } = await request.json()
    
    if (!projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing projectId or contractorId' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // 1. Check if contractor is already applied
    const { data: existing, error: checkError } = await supabase
      .from('site_visit_applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied for this site visit' },
        { status: 400 }
      )
    }
    
    // 2. Insert site visit application
    const { data: application, error: insertError } = await supabase
      .from('site_visit_applications')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`Failed to create site visit application: ${insertError.message}`)
    }
    
    // 3. Get project information
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      throw new Error('Project not found')
    }
    
    // 4. Get customer information
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', project.customer_id)
      .single()
    
    if (customerError || !customer) {
      throw new Error('Customer not found')
    }
    
    // 5. Get contractor information
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, contact_name, email, phone, specialties')
      .eq('id', contractorId)
      .single()
    
    if (contractorError || !contractor) {
      throw new Error('Contractor not found')
    }
    
    // 6. Send email notification to customer
    const customerName = customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : customer.email?.split('@')[0] || 'Customer'
    
    const emailSubject = `🏠 New Site Visit Application for Your Project`
    
    const emailBody = createSiteVisitNotificationTemplate(
      customerName,
      contractor,
      project
    )
    
    // Send email
    const emailResult = await sendEmail({
      to: customer.email,
      subject: emailSubject,
      html: emailBody
    })
    
    if (!emailResult.success) {
      console.error('Failed to send site visit notification email:', emailResult.error)
      // Don't fail the request if email fails
    }
    
    console.log('✅ Site visit application created and email sent:', {
      applicationId: application.id,
      projectId,
      contractorId,
      customerEmail: customer.email,
      emailSent: emailResult.success
    })
    
    return NextResponse.json({
      success: true,
      message: 'Site visit application submitted successfully',
      applicationId: application.id,
      emailSent: emailResult.success
    })
    
  } catch (error: any) {
    console.error('Error applying for site visit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply for site visit' },
      { status: 500 }
    )
  }
}
