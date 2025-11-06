import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    console.log('=== UPDATE QUOTE REQUEST ===')
    console.log('Quote ID:', id)
    console.log('Update data:', body)

    const supabase = await createServerClient()

    // 1. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. 견적요청 소유자 확인
    const { data: existingQuote, error: fetchError } = await supabase
      .from('quote_requests')
      .select('customer_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: 'Quote request not found' },
        { status: 404 }
      )
    }

    // 3. 소유자 확인
    if (existingQuote.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this quote request' },
        { status: 403 }
      )
    }

    // 4. pending 상태만 수정 가능
    if (existingQuote.status !== 'pending') {
      return NextResponse.json(
        { error: 'You can only edit quote requests that are pending admin approval' },
        { status: 400 }
      )
    }

    // 5. 업데이트 데이터 준비
    const updateData = {
      space_type: body.space_type || body.spaceType,
      project_types: body.project_types || body.projectTypes,
      budget: body.budget,
      timeline: body.timeline,
      postal_code: body.postal_code || body.postalCode,
      full_address: body.full_address || body.fullAddress,
      visit_date: body.visit_date || body.visitDate || null,
      description: body.description,
      phone: body.phone,
      updated_at: new Date().toISOString()
    }

    console.log('Prepared update data:', updateData)

    // 6. 업데이트 실행
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update quote request', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Quote request updated successfully:', updatedQuote)

    return NextResponse.json({
      success: true,
      message: 'Quote request updated successfully',
      data: updatedQuote
    })

  } catch (error: any) {
    console.error('❌ Update quote request error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
