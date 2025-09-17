// ============================================
// 9. API 라우트 - 견적서 제출
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component에서 호출된 경우 무시
            }
          },
        },
      }
    )

    const { projectId, contractorId, price, description, pdfUrl, pdfFilename } = await request.json()

    // 필수 필드 검증
    if (!projectId || !contractorId || !price || !description) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 프로젝트가 비딩 상태인지 확인
    const { data: project, error: projectError } = await supabase
      .from('quote_requests')
      .select('status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (project.status !== 'bidding') {
      return NextResponse.json(
        { error: '현재 프로젝트는 견적서 제출 단계가 아닙니다.' },
        { status: 400 }
      )
    }

    // 견적서 저장
    const { data: quote, error: quoteError } = await supabase
      .from('contractor_quotes')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        price: parseFloat(price),
        description,
        pdf_url: pdfUrl,
        pdf_filename: pdfFilename,
        status: 'submitted'
      })
      .select()
      .single()

    if (quoteError) {
      console.error('견적서 저장 오류:', quoteError)
      return NextResponse.json(
        { error: '견적서 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 프로젝트 상태를 quote-submitted로 변경
    const { error: statusError } = await supabase
      .from('quote_requests')
      .update({ 
        status: 'quote-submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (statusError) {
      console.error('프로젝트 상태 업데이트 오류:', statusError)
      // 견적서는 저장되었으므로 경고만 로그
    }

    return NextResponse.json({
      success: true,
      data: quote,
      message: '견적서가 성공적으로 제출되었습니다.'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
