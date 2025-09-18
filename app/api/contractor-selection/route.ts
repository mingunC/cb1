import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractorQuoteId, projectId, contractorId } = body

    console.log('=== CONTRACTOR SELECTION API ===')
    console.log('Input:', { contractorQuoteId, projectId, contractorId })

    // Supabase 서버 클라이언트 생성
    const supabase = createServerClient()

    // 1. 먼저 현재 프로젝트 상태 확인
    const { data: currentProject, error: checkError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', projectId)
      .single()

    console.log('Current project status:', currentProject?.status)

    if (checkError) {
      console.error('Error checking current status:', checkError)
    }

    // 2. 선택된 업체의 견적서 상태를 'accepted'로 변경
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
      console.error('❌ Error updating contractor quote status:', updateError)
      return NextResponse.json(
        { error: '업체 견적서 상태 업데이트 실패', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Contractor quote accepted:', acceptedQuote?.id)

    // 3. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
    const { data: rejectedQuotes, error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .neq('id', contractorQuoteId)
      .select()

    if (rejectError) {
      console.error('⚠️ Warning: Error rejecting other quotes:', rejectError)
      // 이 오류는 치명적이지 않으므로 계속 진행
    } else {
      console.log(`✅ Rejected ${rejectedQuotes?.length || 0} other quotes`)
    }

    // 4. 프로젝트(quote_request) 상태를 'completed'로 변경 - 가장 중요!
    const { data: updatedProject, error: projectError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (projectError) {
      console.error('❌ CRITICAL: Error updating project status:', projectError)
      console.error('Project ID:', projectId)
      console.error('Error details:', projectError.message, projectError.code, projectError.details)
      
      return NextResponse.json(
        { error: '프로젝트 상태 업데이트 실패', details: projectError.message },
        { status: 500 }
      )
    }

    console.log('✅ Project status updated to:', updatedProject?.status)
    console.log('=== UPDATE COMPLETE ===')

    return NextResponse.json({ 
      success: true, 
      message: '업체 선택이 완료되었습니다',
      projectStatus: updatedProject?.status || 'completed',
      updatedAt: updatedProject?.updated_at
    })

  } catch (error) {
    console.error('❌ Contractor selection API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
}
