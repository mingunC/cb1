import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server-clients'
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

// ✅ Commission 생성 함수 분리 (에러 처리 강화)
async function createCommissionTracking(
  supabase: any,
  projectId: string,
  contractorId: string,
  contractorName: string,
  projectTitle: string,
  quotePrice: number,
  startTime: string
): Promise<{ success: boolean; commissionId?: string; error?: string }> {
  try {
    console.log('💰 === COMMISSION CREATION START ===')
    console.log('📋 Input data:', {
      projectId,
      contractorId,
      contractorName,
      projectTitle,
      quotePrice,
      startTime
    })

    // 1. 입력값 검증
    if (!projectId || !contractorId || !contractorName || !quotePrice || quotePrice <= 0) {
      const missingFields = []
      if (!projectId) missingFields.push('projectId')
      if (!contractorId) missingFields.push('contractorId')
      if (!contractorName) missingFields.push('contractorName')
      if (!quotePrice || quotePrice <= 0) missingFields.push('valid quotePrice')
      
      const errorMsg = `Missing or invalid required fields: ${missingFields.join(', ')}`
      console.error('❌ Validation failed:', errorMsg)
      return { success: false, error: errorMsg }
    }

    // 2. 중복 체크
    console.log('🔍 Checking for existing commission...')
    const { data: existingCommission, error: checkError } = await supabase
      .from('commission_tracking')
      .select('id')
      .eq('quote_request_id', projectId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing commission:', checkError)
      return { success: false, error: `Check failed: ${checkError.message}` }
    }

    if (existingCommission) {
      console.log('ℹ️ Commission already exists:', existingCommission.id)
      return { success: true, commissionId: existingCommission.id }
    }

    // 3. Commission 계산
    const commissionRate = calculateCommissionRate(quotePrice)
    const commissionAmount = quotePrice * (commissionRate / 100)
    
    console.log('💵 Commission calculation:', {
      quotePrice,
      commissionRate: `${commissionRate}%`,
      commissionAmount: `$${commissionAmount.toFixed(2)}`
    })

    // 4. Commission 데이터 생성
    const commissionData = {
      quote_request_id: projectId,
      contractor_id: contractorId,
      contractor_name: contractorName,
      project_title: projectTitle,
      quote_amount: quotePrice,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      status: 'pending',
      started_at: startTime,
      marked_manually: false
    }

    console.log('💾 Inserting commission data...')
    const { data: newCommission, error: insertError } = await supabase
      .from('commission_tracking')
      .insert(commissionData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Commission insert failed:', insertError)
      console.error('❌ Failed data:', JSON.stringify(commissionData, null, 2))
      return { success: false, error: `Insert failed: ${insertError.message}` }
    }

    if (!newCommission) {
      console.error('❌ Commission created but no data returned')
      return { success: false, error: 'No data returned after insert' }
    }

    console.log('✅ ✅ ✅ Commission created successfully!')
    console.log('💵 Commission ID:', newCommission.id)
    console.log('💵 Commission Amount: $' + commissionAmount.toFixed(2))
    console.log('💰 === COMMISSION CREATION END ===')

    return { success: true, commissionId: newCommission.id }

  } catch (error: any) {
    console.error('❌ Unexpected error in createCommissionTracking:', error)
    return { success: false, error: error.message }
  }
}

// ✅ 관리자에게 Commission 생성 실패 알림 발송
async function notifyAdminCommissionFailure(
  projectId: string,
  contractorName: string,
  quotePrice: number,
  errorMessage: string
) {
  try {
    await sendEmail({
      to: 'cmgg919@gmail.com', // 관리자 이메일
      subject: '⚠️ [긴급] Commission Tracking 생성 실패',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .error-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Commission Tracking 생성 실패</h1>
              <p style="margin: 0;">프로젝트가 시작되었으나 Commission이 생성되지 않았습니다</p>
            </div>
            
            <div class="content">
              <div class="error-box">
                <h3 style="margin-top: 0; color: #dc2626;">❌ 에러 메시지</h3>
                <p style="margin: 0;"><code>${errorMessage}</code></p>
              </div>

              <div class="info-box">
                <h3 style="color: #dc2626; margin-top: 0;">📋 프로젝트 정보</h3>
                <p><strong>Project ID:</strong> <code>${projectId}</code></p>
                <p><strong>Contractor:</strong> ${contractorName}</p>
                <p><strong>Quote Amount:</strong> $${quotePrice.toLocaleString()}</p>
              </div>

              <div class="info-box">
                <h3 style="color: #d97706; margin-top: 0;">🔧 조치 필요</h3>
                <p>다음 SQL을 실행하여 수동으로 Commission을 생성해주세요:</p>
                <pre style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>INSERT INTO commission_tracking (
  quote_request_id,
  contractor_id,
  contractor_name,
  project_title,
  quote_amount,
  commission_rate,
  commission_amount,
  status,
  started_at,
  marked_manually
)
SELECT 
  qr.id,
  qr.selected_contractor_id,
  c.company_name,
  CONCAT(qr.space_type, ' - ', qr.full_address),
  cq.price,
  CASE 
    WHEN cq.price < 50000 THEN 3.00
    WHEN cq.price >= 50000 AND cq.price < 100000 THEN 2.00
    ELSE 1.00
  END,
  CASE 
    WHEN cq.price < 50000 THEN cq.price * 0.03
    WHEN cq.price >= 50000 AND cq.price < 100000 THEN cq.price * 0.02
    ELSE cq.price * 0.01
  END,
  'pending',
  qr.project_started_at,
  true
FROM quote_requests qr
JOIN contractors c ON c.id = qr.selected_contractor_id
JOIN contractor_quotes cq ON cq.id = qr.selected_quote_id
WHERE qr.id = '${projectId}';</code></pre>
              </div>

              <p style="margin-top: 30px;">
                <strong>Canada Beaver Admin System</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    console.log('✅ Admin notification sent for commission failure')
  } catch (emailError: any) {
    console.error('⚠️ Failed to send admin notification:', emailError.message)
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
    console.log('📌 Contractor ID:', currentProject.selected_contractor_id)
    const { data: contractorInfo, error: contractorError } = await supabase
      .from('contractors')
      .select('company_name, contact_name, email')
      .eq('id', currentProject.selected_contractor_id)
      .single()

    if (contractorError) {
      console.error('❌ Contractor query error:', contractorError)
      console.error('📌 Failed to get contractor for ID:', currentProject.selected_contractor_id)
    } else if (!contractorInfo) {
      console.error('❌ Contractor not found for ID:', currentProject.selected_contractor_id)
    } else {
      console.log('✅ Contractor info loaded:', {
        company_name: contractorInfo.company_name,
        email: contractorInfo.email
      })
    }

    // 7. 선정된 견적 정보 조회 - Admin client 사용
    console.log('🔍 Fetching selected quote info...')
    console.log('📌 Quote ID:', currentProject.selected_quote_id)
    
    const adminClient = createAdminClient()
    let selectedQuote = null
    
    // 먼저 quote_id로 조회
    const { data: quoteById, error: quoteError } = await adminClient
      .from('contractor_quotes')
      .select('price, id')
      .eq('id', currentProject.selected_quote_id)
      .maybeSingle()
    if (!quoteError && quoteById) {
      selectedQuote = quoteById
      console.log('✅ Quote found:', { price: quoteById.price, id: quoteById.id })
    } else {
      // Fallback: project_id와 contractor_id로 조회
      console.log('🔄 Trying fallback: project_id + contractor_id...')
      const { data: fallbackQuote } = await adminClient
        .from('contractor_quotes')
        .select('price, id')
        .eq('project_id', projectId)
        .eq('contractor_id', currentProject.selected_contractor_id)
        .maybeSingle()
      
      if (fallbackQuote) {
        selectedQuote = fallbackQuote
        console.log('✅ Quote found via fallback:', { price: fallbackQuote.price, id: fallbackQuote.id })
      } else {
        console.error('❌ Quote not found')
      }
    }

    // 8. ✅ 개선된 Commission tracking 생성
    let commissionResult: { success: boolean; commissionId?: string; error?: string } = { 
      success: false, 
      error: 'Not attempted' 
    }

    if (contractorInfo && selectedQuote && selectedQuote.price) {
      const projectTitle = `${currentProject.space_type} - ${currentProject.full_address}`
      
      commissionResult = await createCommissionTracking(
        adminClient,
        projectId,
        currentProject.selected_contractor_id,
        contractorInfo.company_name,
        projectTitle,
        selectedQuote.price,
        projectStartTime
      )

      // ✅ Commission 생성 실패 시 관리자에게 알림
      if (!commissionResult.success) {
        console.error('❌❌❌ COMMISSION CREATION FAILED ❌❌❌')
        console.error('Error:', commissionResult.error)
        
        // 관리자에게 이메일 알림
        await notifyAdminCommissionFailure(
          projectId,
          contractorInfo.company_name,
          selectedQuote.price,
          commissionResult.error || 'Unknown error'
        )
      }
    } else {
      const missingItems = []
      if (!contractorInfo) missingItems.push('Contractor info')
      if (!selectedQuote) missingItems.push('Selected quote')
      if (selectedQuote && !selectedQuote.price) missingItems.push('Quote price')
      
      const errorMsg = `Missing required data: ${missingItems.join(', ')}`
      console.error('❌ Cannot create commission:', errorMsg)
      commissionResult = { success: false, error: errorMsg }
      
      // 관리자에게 알림
      await notifyAdminCommissionFailure(
        projectId,
        contractorInfo?.company_name || 'Unknown',
        selectedQuote?.price || 0,
        errorMsg
      )
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
                  <p>© 2025 Canada Beaver. All rights reserved.</p>
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
                  <p>© 2025 Canada Beaver. All rights reserved.</p>
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
      startedAt: updatedProject.project_started_at,
      commission: {
        created: commissionResult.success,
        commissionId: commissionResult.commissionId,
        error: commissionResult.error
      }
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
