import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractorQuoteId, projectId, contractorId } = body

    console.log('Contractor selection API called:', { contractorQuoteId, projectId, contractorId })

    // Supabase 서버 클라이언트 생성
    const supabase = createServerClient()

    // 1. 선택된 업체의 견적서 상태를 'accepted'로 변경
    const { error: updateError } = await supabase
      .from('contractor_quotes')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', contractorQuoteId)

    if (updateError) {
      console.error('Error updating contractor quote status:', updateError)
      return NextResponse.json(
        { error: '업체 견적서 상태 업데이트 실패', details: updateError.message },
        { status: 500 }
      )
    }

    // 2. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
    const { error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .neq('id', contractorQuoteId)

    if (rejectError) {
      console.error('Error rejecting other contractor quotes:', rejectError)
      // 이 오류는 치명적이지 않으므로 계속 진행
    }

    // 3. 프로젝트(quote_request) 상태를 'completed'로 변경 - 가장 중요!
    const { error: projectError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (projectError) {
      console.error('Error updating project status to completed:', projectError)
      return NextResponse.json(
        { error: '프로젝트 상태 업데이트 실패', details: projectError.message },
        { status: 500 }
      )
    }

    console.log('Successfully updated all statuses - project is now completed')

    return NextResponse.json({ 
      success: true, 
      message: '업체 선택이 완료되었습니다',
      projectStatus: 'completed'
    })

  } catch (error) {
    console.error('Contractor selection API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}