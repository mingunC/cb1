import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { projectId, contractorId, quoteId } = await request.json()
    
    console.log('🎯 API 요청 받음:', { projectId, contractorId, quoteId })
    
    if (!projectId || !contractorId || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // 0. 현재 프로젝트 상태 확인
    const { data: currentProject } = await supabase
      .from('quote_requests')
      .select('status, selected_contractor_id')
      .eq('id', projectId)
      .single()
    
    console.log('📊 현재 프로젝트 상태:', currentProject)
    
    // 이미 업체가 선택된 경우
    if (currentProject?.selected_contractor_id) {
      console.log('⚠️ 이미 업체가 선택된 프로젝트입니다')
      return NextResponse.json({
        success: false,
        message: '이미 다른 업체가 선택되었습니다'
      }, { status: 400 })
    }
    
    // 1. 프로젝트 상태 업데이트 - 입찰 종료 및 업체 선정
    // ⭐ CRITICAL: bidding-closed로 변경 (completed가 아님!)
    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'bidding-closed',  // ✅ 입찰 종료 상태
        selected_contractor_id: contractorId,
        selected_quote_id: quoteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (updateError) {
      console.error('❌ 프로젝트 업데이트 에러:', updateError)
      throw updateError
    }
    
    console.log('✅ 프로젝트 상태 업데이트 완료: bidding-closed')
    
    // 2. 견적서 상태 업데이트 - 선택된 견적서는 accepted
    const { error: quoteError } = await supabase
      .from('contractor_quotes')
      .update({
        status: 'accepted'
      })
      .eq('id', quoteId)
    
    if (quoteError) {
      console.error('❌ 견적서 업데이트 에러:', quoteError)
      throw quoteError
    }
    
    console.log('✅ 선택된 견적서 상태: accepted')
    
    // 3. 선택되지 않은 견적서는 rejected로 변경
    const { error: rejectError } = await supabase
      .from('contractor_quotes')
      .update({
        status: 'rejected'
      })
      .eq('project_id', projectId)
      .neq('id', quoteId)
    
    if (rejectError) {
      console.error('⚠️ 다른 견적서 rejected 처리 실패:', rejectError)
      // 이 부분은 실패해도 계속 진행
    } else {
      console.log('✅ 미선택 견적서 상태: rejected')
    }
    
    // 4. 이메일 발송 API 호출
    let emailSent = false
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
      
      if (emailResponse.ok) {
        emailSent = true
        console.log('✅ 축하 이메일 발송 완료')
      } else {
        console.error('⚠️ 이메일 발송 실패, 하지만 업체 선택은 완료')
      }
    } catch (emailError) {
      console.error('❌ 이메일 발송 에러:', emailError)
      // 이메일 발송 실패해도 업체 선택은 성공으로 처리
    }
    
    return NextResponse.json({ 
      success: true,
      message: '업체가 선택되었습니다. 축하 이메일이 발송됩니다.',
      projectStatus: 'bidding-closed',  // ✅ 올바른 상태 반환
      emailSent
    })
    
  } catch (error: any) {
    console.error('❌ API 에러:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to select contractor' 
      },
      { status: 500 }
    )
  }
}
