import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { projectId, contractorId } = await request.json()

    if (!projectId || !contractorId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, contractorId' },
        { status: 400 }
      )
    }

    console.log('🗑️ Cancel Site Visit Request:', { projectId, contractorId })

    const supabase = createRouteHandlerClient({ cookies })

    // ✅ 1. 현장방문 신청이 존재하는지 확인
    const { data: existingVisit, error: checkError } = await supabase
      .from('site_visit_applications')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single()

    if (checkError || !existingVisit) {
      console.log('⚠️ No site visit application found')
      return NextResponse.json(
        { error: 'No site visit application found' },
        { status: 404 }
      )
    }

    // ✅ 2. 이미 승인된 경우 취소 불가
    if (existingVisit.status === 'completed') {
      console.log('⚠️ Cannot cancel completed site visit')
      return NextResponse.json(
        { error: 'Cannot cancel completed site visit' },
        { status: 400 }
      )
    }

    // ✅ 3. 현장방문 신청 삭제
    const { error: deleteError } = await supabase
      .from('site_visit_applications')
      .delete()
      .eq('id', existingVisit.id)

    if (deleteError) {
      console.error('❌ Error deleting site visit:', deleteError)
      throw deleteError
    }

    console.log('✅ Site visit application cancelled successfully')

    return NextResponse.json({
      success: true,
      message: 'Site visit application cancelled successfully'
    })

  } catch (error: any) {
    console.error('❌ Error cancelling site visit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel site visit' },
      { status: 500 }
    )
  }
}
