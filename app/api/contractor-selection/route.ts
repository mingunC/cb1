import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { contractorQuoteId, projectId, contractorId } = await request.json()

    console.log('API Route called with:', { contractorQuoteId, projectId, contractorId })

    if (!contractorQuoteId || !projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 서비스 키를 사용하여 RLS 우회
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseServiceKey || !supabaseUrl) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting database updates...')

    // 1. 선택된 업체의 상태를 'accepted'로 변경
    console.log('Updating contractor quote to accepted:', contractorQuoteId)
    const { data: updateData, error: updateError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'accepted' })
      .eq('id', contractorQuoteId)
      .select()

    if (updateError) {
      console.error('Error updating contractor quote status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update contractor quote status', details: updateError },
        { status: 500 }
      )
    }
    console.log('Successfully updated contractor quote:', updateData)

    // 2. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
    console.log('Rejecting other contractor quotes for project:', projectId)
    const { data: rejectData, error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .neq('id', contractorQuoteId)
      .select()

    if (rejectError) {
      console.error('Error rejecting other contractor quotes:', rejectError)
      // 이 오류는 치명적이지 않으므로 계속 진행
    } else {
      console.log('Successfully rejected other quotes:', rejectData)
    }

    // 3. 프로젝트 상태를 'completed'로 변경
    console.log('Updating project status to completed:', projectId)
    const { data: projectData, error: projectError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()

    if (projectError) {
      console.error('Error updating project status:', projectError)
      return NextResponse.json(
        { error: 'Failed to update project status', details: projectError },
        { status: 500 }
      )
    }
    console.log('Successfully updated project:', projectData)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
