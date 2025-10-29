import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'
import { 
  sendEmail, 
  createSelectionEmailTemplate, 
  createCustomerNotificationTemplate 
} from '@/lib/email/mailgun'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractorQuoteId, projectId, contractorId } = body

    console.log('=== CONTRACTOR SELECTION API ===')
    console.log('Input:', { contractorQuoteId, projectId, contractorId })

    // 입력값 검증
    if (!contractorQuoteId || !projectId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // Supabase 서버 클라이언트 생성
    const supabase = createServerClient()

    // 트랜잭션처럼 작동하도록 모든 작업을 순차적으로 실행하고
    // 하나라도 실패하면 롤백 시뮬레이션
    let updateResults = {
      acceptedQuote: null as any,
      rejectedQuotes: null as any,
      updatedProject: null as any
    }

    try {
      // 1. 먼저 현재 프로젝트와 견적 상태 확인
      const { data: currentProject, error: checkError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', projectId)
        .single()

      if (checkError || !currentProject) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${checkError?.message}`)
      }

      console.log('Current project status:', currentProject.status)

      // 이미 업체가 선정되었거나 진행 중인지 확인
      if (['contractor-selected', 'in-progress', 'completed'].includes(currentProject.status)) {
        console.log('Project already has a selected contractor')
        return NextResponse.json({
          success: false,
          message: '이미 업체가 선정된 프로젝트입니다',
          projectStatus: currentProject.status
        })
      }

      // 2. 선택된 견적이 해당 프로젝트의 것인지 확인
      const { data: selectedQuote, error: quoteCheckError } = await supabase
        .from('contractor_quotes')
        .select('*')
        .eq('id', contractorQuoteId)
        .eq('project_id', projectId)
        .single()

      if (quoteCheckError || !selectedQuote) {
        throw new Error(`유효하지 않은 견적서입니다: ${quoteCheckError?.message}`)
      }

      // 3. 선택된 업체의 견적서 상태를 'accepted'로 변경
      const { data: acceptedQuote, error: updateError } = await supabase
        .from('contractor_quotes')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', contractorQuoteId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`견적서 승인 실패: ${updateError.message}`)
      }

      updateResults.acceptedQuote = acceptedQuote
      console.log('✅ Contractor quote accepted:', acceptedQuote?.id)

      // 4. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
      const { data: rejectedQuotes, error: rejectError } = await supabase
        .from('contractor_quotes')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .neq('id', contractorQuoteId)
        .neq('status', 'rejected') // 이미 rejected인 것은 제외
        .select()

      if (rejectError) {
        console.error('⚠️ Warning: Error rejecting other quotes:', rejectError)
        // 다른 견적 거절 실패는 치명적이지 않으므로 경고만 표시
      } else {
        updateResults.rejectedQuotes = rejectedQuotes
        console.log(`✅ Rejected ${rejectedQuotes?.length || 0} other quotes`)
      }

      // 5. ✅ 프로젝트 상태를 'contractor-selected'로 변경 (completed 아님!)
      const { data: updatedProject, error: projectError } = await supabase
        .from('quote_requests')
        .update({ 
          status: 'contractor-selected',  // ✅ 변경: completed → contractor-selected
          selected_contractor_id: contractorId || acceptedQuote?.contractor_id,
          selected_quote_id: contractorQuoteId,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()

      if (projectError) {
        // 프로젝트 업데이트 실패 시 견적서 상태 되돌리기 시도
        console.error('❌ CRITICAL: Error updating project status, attempting rollback...')
        
        // 롤백: 견적서 상태를 원래대로 되돌리기
        await supabase
          .from('contractor_quotes')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', contractorQuoteId)

        throw new Error(`프로젝트 상태 업데이트 실패: ${projectError.message}`)
      }

      updateResults.updatedProject = updatedProject
      console.log('✅ Project status updated to:', updatedProject?.status)

      // 6. ✅ 업체 정보 조회 (이메일 발송용) - 개선된 로직
      console.log('🔍 업체 정보 조회 시작, contractor_id:', acceptedQuote?.contractor_id)
      
      const { data: contractorInfo, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', acceptedQuote?.contractor_id)
        .single()

      if (contractorError) {
        console.error('❌ contractors 테이블 조회 실패:', contractorError)
      } else {
        console.log('✅ contractors 테이블 조회 성공:', {
          id: contractorInfo?.id,
          company_name: contractorInfo?.company_name,
          email: contractorInfo?.email || '(비어있음)',
          user_id: contractorInfo?.user_id
        })
      }

      // ✅ 이메일이 비어있으면 users 테이블에서 조회
      let contractorEmail = contractorInfo?.email
      let emailSource = 'contractors'

      if (!contractorEmail && contractorInfo?.user_id) {
        console.log('📧 contractors.email이 비어있음. users 테이블에서 조회 시도...')
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', contractorInfo.user_id)
          .single()

        if (!userError && userData?.email) {
          contractorEmail = userData.email
          emailSource = 'users'
          console.log('✅ users 테이블에서 이메일 찾음:', contractorEmail)
        } else {
          console.log('❌ users 테이블에도 이메일 없음:', userError?.message)
        }
      }

      // ✅ users 테이블에도 없으면 auth.users에서 조회
      if (!contractorEmail && contractorInfo?.user_id) {
        console.log('📧 users 테이블에도 없음. auth.users에서 조회 시도...')
        
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
          contractorInfo.user_id
        )

        if (!authError && authUser?.user?.email) {
          contractorEmail = authUser.user.email
          emailSource = 'auth.users'
          console.log('✅ auth.users에서 이메일 찾음:', contractorEmail)
        } else {
          console.log('❌ auth.users에도 이메일 없음:', authError?.message)
        }
      }

      console.log('📧 최종 이메일 주소:', contractorEmail || '(없음)', '출처:', emailSource)

      // 7. ✅ 고객 정보 조회 (users 테이블 + quote_requests 테이블)
      const { data: customerInfo, error: customerError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone')
        .eq('id', currentProject.customer_id)
        .single()

      // quote_requests 테이블의 customer_phone 필드도 확인 (우선순위 높음)
      const customerPhone = currentProject.customer_phone || customerInfo?.phone
      const customerName = `${customerInfo?.first_name || ''} ${customerInfo?.last_name || ''}`.trim()

      if (customerError) {
        console.error('고객 정보 조회 실패:', customerError)
      } else {
        console.log('✅ Customer info loaded:', {
          email: customerInfo?.email,
          phone: customerPhone,
          name: customerName || '고객'
        })
      }

      // 8. ✅ 이메일 발송 (실패해도 전체 프로세스는 계속 진행)
      if (contractorEmail) {
        try {
          console.log('📧 이메일 발송 시작:', contractorEmail)
          
          // ✅ 업체에게 선정 알림 이메일 발송 (고객 정보 포함)
          const contractorEmailHtml = createSelectionEmailTemplate(
            contractorInfo?.contact_name || contractorInfo?.company_name || '업체',
            currentProject,
            acceptedQuote,
            {
              ...customerInfo,
              phone: customerPhone, // quote_requests 또는 users 테이블의 전화번호
              first_name: customerInfo?.first_name,
              last_name: customerInfo?.last_name
            }
          )

          await sendEmail({
            to: contractorEmail,
            subject: `🎉 축하합니다! "${currentProject.space_type}" 프로젝트에 선정되셨습니다`,
            html: contractorEmailHtml
          })

          console.log('✅ Selection notification email sent to contractor:', contractorEmail, `(출처: ${emailSource})`)

          // 고객에게도 알림 이메일 발송 (옵션)
          if (customerInfo?.email) {
            const customerEmailHtml = createCustomerNotificationTemplate(
              customerName || '고객',
              contractorInfo,
              currentProject,
              acceptedQuote
            )

            await sendEmail({
              to: customerInfo.email,
              subject: `✅ 프로젝트 업체 선정이 완료되었습니다`,
              html: customerEmailHtml
            })

            console.log('✅ Notification email sent to customer')
          }
        } catch (emailError: any) {
          // 이메일 발송 실패는 전체 프로세스를 중단시키지 않음
          console.error('❌ 이메일 발송 실패 (프로세스는 계속됨):', emailError)
        }
      } else {
        console.warn('⚠️ 업체 이메일을 찾을 수 없어 이메일을 발송하지 않습니다')
      }

      // 9. ✅ 최종 검증 - 프로젝트 상태가 'contractor-selected'로 변경되었는지 확인
      const { data: finalCheck, error: finalError } = await supabase
        .from('quote_requests')
        .select('status')
        .eq('id', projectId)
        .single()

      if (finalError || finalCheck?.status !== 'contractor-selected') {
        throw new Error('프로젝트 상태 업데이트 검증 실패')
      }

      console.log('✅ Final verification successful:', finalCheck.status)
      console.log('=== UPDATE COMPLETE ===')

      // 성공 응답
      return NextResponse.json({ 
        success: true, 
        message: '업체 선택이 완료되었습니다. 업체가 연락드릴 예정입니다.',
        projectStatus: 'contractor-selected',  // ✅ 변경
        updatedAt: updatedProject?.updated_at,
        emailSent: !!contractorEmail,
        emailSource: contractorEmail ? emailSource : null,
        details: {
          acceptedQuoteId: acceptedQuote?.id,
          rejectedCount: rejectedQuotes?.length || 0,
          projectId: projectId
        }
      })

    } catch (innerError: any) {
      console.error('❌ Transaction failed:', innerError.message)
      
      // 실패한 경우 모든 변경사항 되돌리기 시도
      if (updateResults.acceptedQuote) {
        await supabase
          .from('contractor_quotes')
          .update({ status: 'pending' })
          .eq('id', contractorQuoteId)
      }

      throw innerError
    }

  } catch (error: any) {
    console.error('❌ Contractor selection API error:', error)
    return NextResponse.json(
      { 
        error: '업체 선택 처리 중 오류가 발생했습니다', 
        details: error.message || error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET 메서드 추가 - 선택 상태 확인용
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

    // 프로젝트 정보와 선택된 업체 정보 조회
    const { data: project, error } = await supabase
      .from('quote_requests')
      .select(`
        *,
        contractor_quotes!inner (
          id,
          contractor_id,
          status,
          price,
          timeline,
          description
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: '프로젝트 조회 실패', details: error.message },
        { status: 500 }
      )
    }

    // 선택된 업체 정보 찾기
    const selectedQuote = project?.contractor_quotes?.find(
      (quote: any) => quote.status === 'accepted'
    )

    return NextResponse.json({
      project: {
        id: project.id,
        status: project.status,
        updatedAt: project.updated_at
      },
      selectedQuote: selectedQuote || null,
      hasSelection: !!selectedQuote,
      totalQuotes: project?.contractor_quotes?.length || 0
    })

  } catch (error: any) {
    console.error('Selection check error:', error)
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
