import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId, quoteId } = await request.json()
    
    if (!projectId || !contractorId || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // 1. 프로젝트 상태 업데이트 - 입찰 종료 및 업체 선정
    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'bidding-closed',
        selected_contractor_id: contractorId,
        selected_quote_id: quoteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (updateError) {
      console.error('Error updating project:', updateError)
      throw updateError
    }
    
    // 2. 견적서 상태 업데이트 - 선택된 견적서는 accepted
    const { error: quoteError } = await supabase
      .from('contractor_quotes')
      .update({
        status: 'accepted'
      })
      .eq('id', quoteId)
    
    if (quoteError) {
      console.error('Error updating quote:', quoteError)
      throw quoteError
    }
    
    // 3. 선택되지 않은 견적서는 rejected로 변경
    const { error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({
        status: 'rejected'
      })
      .eq('project_id', projectId)
      .neq('id', quoteId)
    
    if (rejectError) {
      console.error('Error rejecting other quotes:', rejectError)
      // 이 부분은 실패해도 계속 진행
    }
    
    // 4. 이메일 발송 API 호출
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-selection-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId, 
          contractorId 
        })
      })
      
      if (!emailResponse.ok) {
        console.error('Email sending failed, but contractor was selected')
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // 이메일 발송 실패해도 업체 선택은 성공으로 처리
    }
    
    return NextResponse.json({ 
      success: true,
      message: '업체가 선택되었습니다. 축하 이메일이 발송됩니다.'
    })
    
  } catch (error: any) {
    console.error('Error in select-contractor API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to select contractor' },
      { status: 500 }
    )
  }
}
