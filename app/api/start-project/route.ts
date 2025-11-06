import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'
import { sendEmail } from '@/lib/email/mailgun'

// 수수료 비율 계산 함수
function calculateCommissionRate(quoteAmount: number): number {
  if (quoteAmount < 50000) {
    return 3.00 // 3%
  } else if (quoteAmount >= 50000 && quoteAmount < 100000) {
    return 2.00 // 2%
  } else {
    return 1.00 // 1%
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    console.log('=== START PROJECT API ===')
    console.log('Project ID:', projectId)

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    console.log('✅ Supabase client created')

    // 1. 현재 프로젝트 상태 확인
    console.log('🔍 Fetching project data...')
    const { data: currentProject, error: checkError } = await supabase
      .from('quote_requests')
      .select(`
        *,
        selected_contractor_id,
        selected_quote_id
      `)
      .eq('id', projectId)
      .single()

    if (checkError) {
      console.error('❌ Project query error:', checkError)
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다', details: checkError.message },
        { status: 404 }
      )
    }

    if (!currentProject) {
      console.error('❌ Project not found')
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.log('✅ Project found:', {
      id: currentProject.id,
      status: currentProject.status,
      selected_contractor_id: currentProject.selected_contractor_id,
      selected_quote_id: currentProject.selected_quote_id,
      project_started_at: currentProject.project_started_at
    })

    // 2. 상태 검증 - contractor-selected 또는 bidding-closed 상태여야 함
    if (currentProject.status !== 'contractor-selected' && currentProject.status !== 'bidding-closed') {
      console.warn('⚠️ Invalid status for starting project:', currentProject.status)
      return NextResponse.json(
        { 
          error: '업체가 선정된 프로젝트만 시작할 수 있습니다',
          currentStatus: currentProject.status 
        },
        { status: 400 }
      )
    }

    // 3. 이미 진행 중이거나 완료된 경우
    if (currentProject.project_started_at) {
      console.log('ℹ️ Project already started')
      return NextResponse.json(
        { 
          success: false,
          message: '이미 시작된 프로젝트입니다',
          projectStatus: currentProject.status 
        }
      )
    }

    // 4. 선정된 업체가 있는지 확인
    if (!currentProject.selected_contractor_id) {
      console.warn('⚠️ No contractor selected')
      return NextResponse.json(
        { error: '선정된 업체가 없습니다' },
        { status: 400 }
      )
    }

    // 4-1. 선정된 견적이 있는지 확인
    if (!currentProject.selected_quote_id) {
      console.warn('⚠️ No quote selected')
      return NextResponse.json(
        { error: '선정된 견적이 없습니다' },
        { status: 400 }
      )
    }

    // 5. 프로젝트 상태를 'in-progress'로 변경
    console.log('📝 Updating project status to in-progress...')
    const projectStartTime = new Date().toISOString()
    const { data: updatedProject, error: updateError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'in-progress',
        project_started_at: projectStartTime,
        updated_at: projectStartTime
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Project update error:', updateError)
      return NextResponse.json(
        { error: '프로젝트 시작 처리 중 오류가 발생했습니다', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedProject) {
      console.error('❌ Updated project not returned')
      return NextResponse.json(
        { error: '프로젝트 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('✅ Project started:', updatedProject.id)
    console.log('✅ Status updated to: in-progress')

    // 6. 업체 정보 조회
    console.log('🔍 Fetching contractor info...')
    const { data: contractorInfo, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, contact_name, email')
      .eq('id', currentProject.selected_contractor_id)
      .single()

    if (contractorError) {
      console.error('⚠️ Contractor query error:', contractorError)
    } else {
      console.log('✅ Contractor info loaded:', contractorInfo?.company_name)
    }

    // 7. 선정된 견적 정보 조회
    console.log('🔍 Fetching selected quote info...')
    const { data: selectedQuote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select('price')
      .eq('id', currentProject.selected_quote_id)
      .single()

    if (quoteError) {
      console.error('⚠️ Quote query error:', quoteError)
    } else {
      console.log('✅ Quote info loaded, price:', selectedQuote?.price)
    }

    // 8. Commission tracking 생성 (선정된 견적과 업체 정보가 있는 경우에만)
    if (contractorInfo && selectedQuote && selectedQuote.price) {
      console.log('💰 Creating commission tracking...')
      
      // 견적 금액에 따라 수수료 비율 결정
      const commissionRate = calculateCommissionRate(selectedQuote.price)
      const commissionAmount = selectedQuote.price * (commissionRate / 100)
      
      console.log(`💵 Quote: $${selectedQuote.price}, Rate: ${commissionRate}%, Commission: $${commissionAmount}`)
      
      // 프로젝트 제목 생성
      const projectTitle = `${currentProject.space_type} - ${currentProject.full_address}`
      
      // 이미 commission_tracking이 있는지 확인
      const { data: existingCommission } = await supabase
        .from('commission_tracking')
        .select('id')
        .eq('quote_request_id', projectId)
        .single()

      if (existingCommission) {
        console.log('ℹ️ Commission tracking already exists for this project')
      } else {
        const { data: newCommission, error: commissionError } = await supabase
          .from('commission_tracking')
          .insert({
            quote_request_id: projectId,
            contractor_id: currentProject.selected_contractor_id,
            contractor_name: contractorInfo.company_name,
            project_title: projectTitle,
            quote_amount: selectedQuote.price,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            status: 'pending',
            started_at: projectStartTime,
            marked_manually: false
          })
          .select()
          .single()

        if (commissionError) {
          console.error('❌ Commission tracking creation error:', commissionError)
          // Commission 생성 실패는 프로젝트 시작을 막지 않음
        } else {
          console.log('✅ Commission tracking created:', newCommission?.id)
          console.log(`💵 Commission: $${commissionAmount} (${commissionRate}%)`)
        }
      }
    } else {
      console.warn('⚠️ Skipping commission tracking - missing contractor info or quote price')
    }

    // 9. 고객 정보 조회
    console.log('🔍 Fetching customer info...')
    const { data: customerInfo, error: customerError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', currentProject.customer_id)
      .single()

    if (customerError) {
      console.error('⚠️ Customer query error (continuing):', customerError)
    } else {
      console.log('✅ Customer info loaded:', customerInfo?.email)
    }

    const customerName = `${customerInfo?.first_name || ''} ${customerInfo?.last_name || ''}`.trim() || 'Customer'

    // 10. 고객에게 프로젝트 시작 축하 이메일 발송
    if (customerInfo?.email) {
      try {
        console.log('📧 Sending congratulations email to customer...')
        await sendEmail({
          to: customerInfo.email,
          subject: '🎉 Congratulations! Your Project Has Started',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
                .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .highlight { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 18px;">Your renovation project has officially started</p>
                </div>
                
                <div class="content">
                  <p>Hello, <strong>${customerName}</strong></p>
                  
                  <div class="highlight">
                    <h3 style="margin-top: 0; color: #d97706;">✨ Your Project Has Officially Started!</h3>
                    <p style="margin-bottom: 0;">The transformation of your dream space begins now.</p>
                  </div>

                  <div class="info-box">
                    <h3 style="color: #667eea; margin-top: 0;">📋 Project Information</h3>
                    <p style="margin: 10px 0;"><strong>Selected Contractor:</strong> ${contractorInfo?.company_name || 'Contractor'}</p>
                    <p style="margin: 10px 0;"><strong>Project Type:</strong> ${currentProject.space_type}</p>
                    <p style="margin: 10px 0;"><strong>Address:</strong> ${currentProject.full_address}</p>
                  </div>
                  
                  <div class="info-box">
                    <h3 style="color: #667eea; margin-top: 0;">👷 Next Steps</h3>
                    <ul style="padding-left: 20px;">
                      <li>Confirm construction preparation details</li>
                      <li>Regular progress updates</li>
                      <li>Final inspection upon completion</li>
                    </ul>
                  </div>

                  <div class="highlight">
                    <p style="margin: 0;"><strong>💡 Tip:</strong> Please communicate regularly with the contractor if you have any questions or changes!</p>
                  </div>
                  
                  <p style="margin-top: 30px; text-align: center;">
                    <strong>We wish you a successful project completion!</strong>
                  </p>
                  
                  <p style="text-align: center;">
                    Thank you,<br>
                    <strong>Canada Beaver Team</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>© 2024 Canada Beaver. All rights reserved.</p>
                  <p>If you have any questions, please feel free to contact us.</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
        
        console.log('✅ Congratulations email sent to customer')
      } catch (emailError: any) {
        console.error('⚠️ Customer email failed (process continues):', emailError.message)
      }
    } else {
      console.log('ℹ️ No customer email to send')
    }

    // 11. 업체에게 프로젝트 시작 알림 이메일 발송
    if (contractorInfo?.email) {
      try {
        console.log('📧 Sending notification email to contractor...')
        await sendEmail({
          to: contractorInfo.email,
          subject: '🚀 Project Started',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
                .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚀 Project Started!</h1>
                  <p style="margin: 0;">The customer has confirmed the project start</p>
                </div>
                
                <div class="content">
                  <p>Hello, <strong>${contractorInfo.company_name}</strong></p>
                  
                  <div class="info-box">
                    <h3 style="color: #28a745; margin-top: 0;">🎉 The Project Has Officially Started</h3>
                    <p><strong>${customerName}</strong> has confirmed the project start.</p>
                    <p style="margin: 15px 0;">📋 Project Type: ${currentProject.space_type}</p>
                    <p style="margin: 15px 0;">📍 Address: ${currentProject.full_address}</p>
                    <p style="margin: 15px 0;">📅 Start Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  
                  <p><strong>Next Steps:</strong></p>
                  <ul>
                    <li>Final confirmation of construction schedule</li>
                    <li>Commission due within 3 days of signing.</li>
                    <li>Prepare necessary materials and workforce</li>
                    <li>Regular progress updates</li>
                    <li>Final inspection upon completion</li>
                  </ul>
                  
                  <p style="margin-top: 30px;">We wish you a successful project completion!</p>
                  
                  <p>
                    Thank you,<br>
                    <strong>Canada Beaver Team</strong>
                  </p>
                </div>
                
                <div class="footer">
                  <p>© 2024 Canada Beaver. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
        
        console.log('✅ Notification email sent to contractor')
      } catch (emailError: any) {
        console.error('⚠️ Contractor email failed (process continues):', emailError.message)
      }
    } else {
      console.log('ℹ️ No contractor email to send')
    }

    console.log('=== PROJECT START COMPLETE ===')

    return NextResponse.json({ 
      success: true, 
      message: '프로젝트가 시작되었습니다. 프로젝트의 성공을 축하드립니다!',
      projectStatus: 'in-progress',
      startedAt: updatedProject.project_started_at
    })

  } catch (error: any) {
    console.error('❌ Start project API error:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: '프로젝트 시작 처리 중 오류가 발생했습니다', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET 메서드 - 프로젝트 진행 상태 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    const { data: project, error } = await supabase
      .from('quote_requests')
      .select('id, status, project_started_at, project_completed_at, updated_at')
      .eq('id', projectId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: '프로젝트 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      project: {
        id: project.id,
        status: project.status,
        isStarted: !!project.project_started_at,
        isCompleted: !!project.project_completed_at,
        startedAt: project.project_started_at,
        completedAt: project.project_completed_at
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
