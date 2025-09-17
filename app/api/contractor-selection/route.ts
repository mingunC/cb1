import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { contractorQuoteId, projectId, contractorId } = await request.json()

    if (!contractorQuoteId || !projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 1. 선택된 업체의 상태를 'accepted'로 변경
    const { error: updateError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'accepted' })
      .eq('id', contractorQuoteId)

    if (updateError) {
      console.error('Error updating contractor quote status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update contractor quote status' },
        { status: 500 }
      )
    }

    // 2. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
    const { error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .neq('id', contractorQuoteId)

    if (rejectError) {
      console.error('Error rejecting other contractor quotes:', rejectError)
      // 이 오류는 치명적이지 않으므로 계속 진행
    }

    // 3. 프로젝트 상태를 'completed'로 변경
    const { error: projectError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (projectError) {
      console.error('Error updating project status:', projectError)
      return NextResponse.json(
        { error: 'Failed to update project status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
