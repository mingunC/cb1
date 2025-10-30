import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

// 리뷰 작성 스키마
const reviewSchema = z.object({
  contractor_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  // ✅ 0.5부터 허용
  rating: z.number().min(0.5).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(10).max(1000),
  photos: z.array(z.string()).optional().default([])
})

// ✅ Authorization 헤더에서 사용자 인증
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Authorization 헤더로 인증
    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    console.log('🔐 Token 인증:', { user: user?.id, error: error?.message })
    return { user, error }
  }
  
  // 쿠키로 인증 (fallback)
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          } catch {}
        },
      },
    }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('🔐 Cookie 인증:', { user: user?.id, error: error?.message })
  return { user, error }
}

export async function POST(request: NextRequest) {
  try {
    // 인증된 사용자 확인
    const { user, error: authError } = await authenticateUser(request)
    
    console.log('🔐 리뷰 POST API - 인증 확인:', {
      user: user?.id,
      email: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Supabase 클라이언트 생성 (인증된 사용자로)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 요청 데이터 파싱 및 검증
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // 고객 정보 확인
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (customerError || !customerData) {
      return NextResponse.json({ error: '고객 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 견적서 정보 확인 - ✅ 명확한 FK 지정
    const { data: quoteData, error: quoteError } = await supabase
      .from('contractor_quotes')
      .select(`
        id,
        contractor_id,
        status,
        quote_requests!contractor_quotes_project_id_fkey (
          id,
          customer_id,
          status
        )
      `)
      .eq('id', validatedData.quote_id)
      .eq('contractor_id', validatedData.contractor_id)
      .single()

    if (quoteError || !quoteData) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 고객이 해당 견적서의 소유자인지 확인
    if ((quoteData.quote_requests as any)?.customer_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 견적서가 수락된 상태인지 확인
    if (quoteData.status !== 'accepted') {
      return NextResponse.json({ 
        error: '선택된 견적서에만 리뷰를 남길 수 있습니다.' 
      }, { status: 400 })
    }

    // ✅ 고객이 한번이라도 bidding을 이용한 적이 있는지 확인
    const { data: userProjects, error: userProjectsError } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .in('status', ['bidding', 'quote-submitted', 'bidding-closed', 'contractor-selected', 'in-progress', 'completed'])
      .limit(1)

    if (userProjectsError || !userProjects || userProjects.length === 0) {
      return NextResponse.json({ 
        error: 'bidding을 이용한 경험이 있는 경우에만 리뷰를 작성할 수 있습니다.' 
      }, { status: 403 })
    }

    // ✅ 해당 프로젝트가 bidding 단계를 거쳤는지 확인
    const projectStatus = (quoteData.quote_requests as any)?.status
    const allowedStatuses = ['bidding', 'quote-submitted', 'bidding-closed', 'contractor-selected', 'in-progress', 'completed']
    
    if (!allowedStatuses.includes(projectStatus)) {
      return NextResponse.json({ 
        error: 'bidding 단계를 거친 프로젝트에만 리뷰를 남길 수 있습니다.' 
      }, { status: 400 })
    }

    // 이미 리뷰를 남겼는지 확인
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('contractor_id', validatedData.contractor_id)
      .eq('customer_id', user.id)
      .eq('quote_id', validatedData.quote_id)
      .single()

    if (existingReview) {
      return NextResponse.json({ 
        error: '이미 해당 견적서에 대한 리뷰를 남기셨습니다.' 
      }, { status: 400 })
    }

    // 리뷰 생성
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        contractor_id: validatedData.contractor_id,
        customer_id: user.id,
        quote_id: validatedData.quote_id,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        photos: validatedData.photos,
        is_verified: true // 공사 완료 고객의 리뷰는 자동으로 검증됨
      })
      .select()
      .single()

    if (reviewError) {
      console.error('리뷰 생성 오류:', reviewError)
      return NextResponse.json({ error: '리뷰 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: reviewData,
      message: '리뷰가 성공적으로 작성되었습니다.' 
    })

  } catch (error) {
    console.error('리뷰 POST API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: '입력 데이터가 올바르지 않습니다.',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 고객이 리뷰를 남길 수 있는 견적서 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증된 사용자 확인
    const { user, error: authError } = await authenticateUser(request)
    
    console.log('🔐 리뷰 GET API - 인증 확인:', {
      user: user?.id,
      email: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // ⚠️ SERVICE ROLE KEY를 사용하여 RLS 우회
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ 고객이 한번이라도 bidding을 이용한 적이 있는지 확인
    const { data: projectsWithBidding, error: biddingCheckError } = await supabaseAdmin
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .in('status', ['bidding', 'quote-submitted', 'bidding-closed', 'contractor-selected', 'in-progress', 'completed'])
      .limit(1)

    if (biddingCheckError) {
      console.error('Bidding 확인 오류:', biddingCheckError)
      return NextResponse.json({ error: '권한 확인에 실패했습니다.' }, { status: 500 })
    }

    // 한번이라도 bidding을 이용한 적이 없다면 리뷰 작성 권한 없음
    if (!projectsWithBidding || projectsWithBidding.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'bidding을 이용한 경험이 있는 경우에만 리뷰를 작성할 수 있습니다.'
      })
    }

    // ✅ 2단계 쿼리: 먼저 project_id 목록을 가져온 후 join
    // Step 1: 사용자의 프로젝트 ID 목록 가져오기
    const { data: userProjectIds, error: projectIdsError } = await supabaseAdmin
      .from('quote_requests')
      .select('id')
      .eq('customer_id', user.id)
      .in('status', ['bidding', 'quote-submitted', 'bidding-closed', 'contractor-selected', 'in-progress', 'completed'])

    if (projectIdsError) {
      console.error('프로젝트 ID 조회 오류:', projectIdsError)
      return NextResponse.json({ error: '프로젝트 조회에 실패했습니다.' }, { status: 500 })
    }

    const projectIds = userProjectIds?.map(p => p.id) || []
    
    if (projectIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'bidding을 이용한 경험이 있는 경우에만 리뷰를 작성할 수 있습니다.'
      })
    }

    console.log('📋 사용자의 프로젝트 ID:', projectIds)

    // Step 2: 해당 프로젝트의 견적서 가져오기 - ⚠️ SERVICE ROLE로 RLS 우회
    const { data: quotesData, error: quotesError } = await supabaseAdmin
      .from('contractor_quotes')
      .select(`
        id,
        price,
        description,
        status,
        created_at,
        project_id,
        contractor_id
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    console.log('📦 contractor_quotes 조회 결과 (SERVICE ROLE):', {
      count: quotesData?.length || 0,
      error: quotesError,
      quotes: quotesData?.slice(0, 3).map(q => ({
        id: q.id,
        status: q.status,
        project_id: q.project_id,
        contractor_id: q.contractor_id
      }))
    })

    if (quotesError) {
      console.error('견적서 조회 오류:', quotesError)
      return NextResponse.json({ error: '견적서 조회에 실패했습니다.' }, { status: 500 })
    }

    if (!quotesData || quotesData.length === 0) {
      console.log('⚠️ 견적서가 없습니다')
      return NextResponse.json({ 
        success: true, 
        data: []
      })
    }

    // Step 2.5: contractor 정보 별도로 조회
    const contractorIds = [...new Set(quotesData.map(q => q.contractor_id))]
    const { data: contractorsData, error: contractorsError } = await supabaseAdmin
      .from('contractors')
      .select('id, company_name, contact_name')
      .in('id', contractorIds)

    console.log('👷 contractors 조회 결과:', {
      count: contractorsData?.length || 0,
      error: contractorsError,
      contractors: contractorsData?.slice(0, 3)
    })

    // contractor 정보를 맵으로 변환
    const contractorsMap = new Map(contractorsData?.map(c => [c.id, c]) || [])

    // Step 3: 프로젝트 정보 가져오기
    const { data: projectsData, error: projectsDataError } = await supabaseAdmin
      .from('quote_requests')
      .select('id, space_type, budget, full_address, status')
      .in('id', projectIds)

    if (projectsDataError) {
      console.error('프로젝트 상세 조회 오류:', projectsDataError)
    }

    // 프로젝트 정보를 맵으로 변환
    const projectsMap = new Map(projectsData?.map(p => [p.id, p]) || [])

    // 견적서에 contractor와 프로젝트 정보 추가
    const quotesWithDetails = quotesData
      .map(quote => {
        const contractor = contractorsMap.get(quote.contractor_id)
        const project = projectsMap.get(quote.project_id)
        
        // contractor 정보가 없으면 제외
        if (!contractor) {
          console.warn(`⚠️ Quote ${quote.id}: contractor ${quote.contractor_id} not found`)
          return null
        }
        
        return {
          ...quote,
          contractors: contractor,
          quote_requests: project
        }
      })
      .filter((q): q is NonNullable<typeof q> => q !== null)

    console.log('📦 프로젝트 정보가 추가된 견적서:', {
      count: quotesWithDetails.length,
      details: quotesWithDetails.slice(0, 3).map(q => ({
        quote_id: q.id,
        quote_status: q.status,
        project_status: q.quote_requests?.status,
        contractor: q.contractors.company_name
      }))
    })

    // 이미 리뷰를 남긴 견적서 ID 목록 조회
    const { data: reviewedQuotes, error: reviewedError } = await supabaseAdmin
      .from('reviews')
      .select('quote_id')
      .eq('customer_id', user.id)

    const reviewedQuoteIds = reviewedQuotes?.map(r => r.quote_id) || []
    console.log('📝 이미 리뷰를 남긴 견적서 ID:', reviewedQuoteIds)

    // 리뷰를 남기지 않은 견적서만 필터링
    const availableQuotes = quotesWithDetails.filter(quote => 
      !reviewedQuoteIds.includes(quote.id)
    )

    console.log('✅ 리뷰 가능한 견적서 수:', availableQuotes.length)

    return NextResponse.json({ 
      success: true, 
      data: availableQuotes 
    })

  } catch (error) {
    console.error('견적서 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
