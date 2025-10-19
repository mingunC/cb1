import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'
import { sendEmail } from '@/lib/email/mailgun'

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

    const supabase = createServerClient()

    // 1. 현재 프로젝트 상태 확인
    const { data: currentProject, error: checkError } = await supabase
      .from('quote_requests')
      .select('*, selected_contractor_id')
      .eq('id', projectId)
      .single()

    if (checkError || !currentProject) {
      console.error('프로젝트 조회 실패:', checkError)
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.log('Current status:', currentProject.status)

    // 2. 상태 검증 - contractor-selected 또는 completed 상태여야 함
    if (!['contractor-selected', 'completed'].includes(currentProject.status)) {
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
      return NextResponse.json(
        { error: '선정된 업체가 없습니다' },
        { status: 400 }
      )
    }

    // 5. 프로젝트 상태를 'in-progress'로 변경
    const { data: updatedProject, error: updateError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'in-progress',
        project_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('프로젝트 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '프로젝트 시작 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    console.log('✅ Project started:', updatedProject.id)
    console.log('✅ Status updated to: in-progress')

    // 6. 업체 정보 조회 (알림 이메일 발송용)
    const { data: contractorInfo } = await supabase
      .from('contractors')
      .select('company_name, contact_name, email')
      .eq('id', currentProject.selected_contractor_id)
      .single()

    // 7. 고객 정보 조회
    const { data: customerInfo } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', currentProject.customer_id)
      .single()

    // 8. 업체에게 프로젝트 시작 알림 이메일 발송 (선택사항)
    if (contractorInfo?.email) {
      try {
        const customerName = `${customerInfo?.first_name || ''} ${customerInfo?.last_name || ''}`.trim() || '고객'
        
        await sendEmail({
          to: contractorInfo.email,
          subject: '🚀 프로젝트가 시작되었습니다',
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
                  <h1>🚀 프로젝트 시작!</h1>
                  <p style="margin: 0;">고객이 프로젝트 시작을 확인했습니다</p>
                </div>
                
                <div class="content">
                  <p>안녕하세요, <strong>${contractorInfo.company_name}</strong>님</p>
                  
                  <div class="info-box">
                    <h3 style="color: #28a745; margin-top: 0;">프로젝트가 공식적으로 시작되었습니다</h3>
                    <p><strong>${customerName}</strong>님이 프로젝트 시작을 확인했습니다.</p>
                    <p style="margin: 15px 0;">📋 프로젝트 유형: ${currentProject.space_type}</p>
                    <p style="margin: 15px 0;">📍 주소: ${currentProject.full_address}</p>
                    <p style="margin: 15px 0;">📅 시작일: ${new Date().toLocaleDateString('ko-KR')}</p>
                  </div>
                  
                  <p><strong>다음 단계:</strong></p>
                  <ul>
                    <li>공사 일정 최종 확인</li>
                    <li>필요한 자재 및 인력 준비</li>
                    <li>정기적인 진행 상황 업데이트</li>
                    <li>완료 후 최종 점검</li>
                  </ul>
                  
                  <p style="margin-top: 30px;">성공적인 프로젝트 완료를 기원합니다!</p>
                  
                  <p>
                    감사합니다.<br>
                    <strong>Canada Beaver 팀</strong>
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
      } catch (emailError) {
        console.error('이메일 발송 실패 (프로세스는 계속됨):', emailError)
      }
    }

    console.log('=== PROJECT START COMPLETE ===')

    return NextResponse.json({ 
      success: true, 
      message: '프로젝트가 시작되었습니다',
      projectStatus: 'in-progress',
      startedAt: updatedProject.project_started_at
    })

  } catch (error: any) {
    console.error('❌ Start project API error:', error)
    return NextResponse.json(
      { 
        error: '프로젝트 시작 처리 중 오류가 발생했습니다', 
        details: error.message 
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

    const supabase = createServerClient()

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
