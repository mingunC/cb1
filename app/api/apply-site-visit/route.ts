import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'
import { createSiteVisitApplicationTemplate } from '@/lib/email/mailgun'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, contractorId } = body
    
    console.log('📝 Site visit application request:', { 
      projectId: projectId ? projectId.slice(0, 8) : 'missing', 
      contractorId: contractorId ? contractorId.slice(0, 8) : 'missing',
      bodyKeys: Object.keys(body)
    })
    
    if (!projectId || !contractorId) {
      console.error('❌ Missing parameters:', { projectId: !!projectId, contractorId: !!contractorId })
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          details: {
            projectId: !projectId ? 'missing' : 'present',
            contractorId: !contractorId ? 'missing' : 'present'
          }
        },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    console.log('🚀 Site visit application started:', { projectId: projectId.slice(0, 8), contractorId: contractorId.slice(0, 8) })
    
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
      console.log('⚠️ Site visit already applied:', existing.id)
      return NextResponse.json(
        { 
          error: 'Site visit already applied',
          message: 'You have already applied for a site visit for this project',
          existingApplication: {
            id: existing.id,
            status: existing.status,
            appliedAt: existing.applied_at
          }
        },
        { status: 409 } // Changed from 400 to 409 (Conflict)
      )
    }
    
    // 2. Insert site visit application
    const insertData = {
      project_id: projectId,
      contractor_id: contractorId,
      status: 'pending',
      applied_at: new Date().toISOString()
    }
    
    console.log('📝 Inserting site visit application:', insertData)
    
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
      .select('company_name, email, phone, user_id')
      .eq('id', contractorId)
      .single()
    
    // 6. Send email notification to customer
    let emailSent = false
    if (customer && contractor && project && customer.email) {
      try {
        const customerName = customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.email?.split('@')[0] || 'Customer'
        
        const emailHTML = createSiteVisitApplicationTemplate(
          customerName,
          {
            company_name: contractor.company_name,
            email: contractor.email,
            phone: contractor.phone
          },
          {
            full_address: project.full_address,
            space_type: project.space_type,
            budget: project.budget
          }
        )
        
        const emailResult = await sendEmail({
          to: customer.email,
          subject: '🏠 New Site Visit Application for Your Project',
          html: emailHTML,
          replyTo: 'support@canadabeaver.pro'
        })
        
        if (emailResult.success) {
          emailSent = true
          console.log('✅ Site visit application email sent successfully:', {
            to: customer.email,
            messageId: (emailResult as any).messageId
          })
        } else {
          console.error('❌ Failed to send email:', emailResult.error)
        }
      } catch (emailError: any) {
        console.error('❌ Error sending site visit application email:', emailError)
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Site visit application submitted successfully',
      data: {
        applicationId: application.id,
        emailSent: emailSent
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
