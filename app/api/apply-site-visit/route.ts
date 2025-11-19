import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, createSiteVisitApplicationTemplate } from '@/lib/email/mailgun'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, contractorId } = body
    
    if (process.env.NODE_ENV === 'development') console.log('📝 Site visit application request:', { 
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
    
    if (process.env.NODE_ENV === 'development') console.log('🚀 Site visit application started:', { projectId: projectId.slice(0, 8), contractorId: contractorId.slice(0, 8) })
    
    // 1. Check if there's an ACTIVE (not cancelled) application
    const { data: activeApplication, error: activeCheckError } = await supabase
      .from('site_visit_applications')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .eq('is_cancelled', false)
      .maybeSingle()
    
    if (activeCheckError) {
      console.error('❌ Active check error:', activeCheckError)
      throw new Error(`Active check failed: ${activeCheckError.message}`)
    }
    
    if (activeApplication) {
      if (process.env.NODE_ENV === 'development') console.log('⚠️ Active site visit already exists:', activeApplication.id)
      return NextResponse.json(
        { 
          error: 'Site visit already applied',
          message: 'You have already applied for a site visit for this project',
          existingApplication: {
            id: activeApplication.id,
            status: activeApplication.status,
            appliedAt: activeApplication.applied_at
          }
        },
        { status: 409 }
      )
    }
    
    // 2. Check if there's a CANCELLED application that we can reactivate
    const { data: cancelledApplication, error: cancelledCheckError } = await supabase
      .from('site_visit_applications')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .eq('is_cancelled', true)
      .maybeSingle()
    
    if (cancelledCheckError) {
      console.error('❌ Cancelled check error:', cancelledCheckError)
      throw new Error(`Cancelled check failed: ${cancelledCheckError.message}`)
    }
    
    let application: any
    
    if (cancelledApplication) {
      // Reactivate the cancelled application
      if (process.env.NODE_ENV === 'development') console.log('🔄 Reactivating cancelled application:', cancelledApplication.id)
      
      const { data: reactivated, error: updateError } = await supabase
        .from('site_visit_applications')
        .update({ 
          is_cancelled: false,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .eq('id', cancelledApplication.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Reactivation error:', updateError)
        throw new Error(`Reactivation failed: ${updateError.message}`)
      }
      
      application = reactivated
      if (process.env.NODE_ENV === 'development') console.log('✅ Site visit application reactivated:', application.id)
    } else {
      // 3. Create a new site visit application
      const insertData = {
        project_id: projectId,
        contractor_id: contractorId,
        status: 'pending',
        applied_at: new Date().toISOString()
      }
      
      if (process.env.NODE_ENV === 'development') console.log('📝 Inserting new site visit application:', insertData)
      
      const { data: newApplication, error: insertError } = await supabase
        .from('site_visit_applications')
        .insert(insertData)
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Insert error:', insertError)
        throw new Error(`Insert failed: ${insertError.message}`)
      }
      
      application = newApplication
      if (process.env.NODE_ENV === 'development') console.log('✅ New site visit application created:', application.id)
    }
    
    // 4. Get project information
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('*, customer_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      console.error('❌ Project not found')
      // Site visit is already created, so we continue
    }
    
    // 5. Get customer information
    let customer = null
    if (project) {
      const { data: customerData, error: customerError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone')
        .eq('id', project.customer_id)
        .single()
      
      customer = customerData
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Customer data retrieved:', {
          hasCustomer: !!customer,
          hasEmail: !!customer?.email,
          email: customer?.email
        })
      }
    }
    
    // 6. Get contractor information
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, email, phone, user_id')
      .eq('id', contractorId)
      .single()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🏢 Contractor data retrieved:', {
        hasContractor: !!contractor,
        companyName: contractor?.company_name
      })
    }
    
    // 7. Send email notification to customer
    let emailSent = false
    if (customer && contractor && project && customer.email) {
      try {
        const customerName = customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.email?.split('@')[0] || 'Customer'
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 Preparing to send email:', {
            to: customer.email,
            customerName: customerName,
            contractorName: contractor.company_name
          })
        }
        
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
          if (process.env.NODE_ENV === 'development') console.log('✅ Site visit application email sent successfully:', {
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
    } else {
      console.warn('⚠️ Cannot send email - missing data:', {
        hasCustomer: !!customer,
        hasCustomerEmail: !!customer?.email,
        hasContractor: !!contractor,
        hasProject: !!project
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Site visit application submitted successfully',
      data: {
        applicationId: application.id,
        emailSent: emailSent,
        wasReactivated: !!cancelledApplication
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
