import { NextRequest, NextResponse } from 'next/server'

// 테스트용 더미 데이터
const dummyPortfolios = [
  {
    id: '1',
    contractor_id: 'test-contractor-123',
    title: '모던 아파트 리노베이션',
    description: '화이트와 우드톤이 조화를 이룬 모던한 아파트 인테리어',
    project_type: '주거공간',
    space_type: 'detached_house',
    photos: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'],
    thumbnail_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    completion_date: '2024-01-01',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    contractor_id: 'test-contractor-123',
    title: '럭셔리 주방 리모델링',
    description: '대리석과 골드 액센트가 돋보이는 고급스러운 주방',
    project_type: '주거공간',
    space_type: 'detached_house',
    photos: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
    thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    completion_date: '2024-02-01',
    created_at: '2024-02-10T14:30:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 400 })
    }

    // 테스트용 데이터 필터링
    const filteredPortfolios = dummyPortfolios.filter(p => p.contractor_id === contractorId)

    return NextResponse.json({ projects: filteredPortfolios })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractor_id, title, description, image_url, category, year } = body

    // 테스트용 응답
    const newProject = {
      id: Date.now().toString(),
      contractor_id,
      title,
      description,
      project_type: category,
      space_type: 'detached_house',
      photos: image_url ? [image_url] : [],
      thumbnail_url: image_url,
      completion_date: year ? `${year}-01-01` : null,
      created_at: new Date().toISOString()
    }

    dummyPortfolios.push(newProject)

    return NextResponse.json({ 
      success: true, 
      project: newProject 
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, image_url, category, year } = body

    // 테스트용 업데이트
    const projectIndex = dummyPortfolios.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    dummyPortfolios[projectIndex] = {
      ...dummyPortfolios[projectIndex],
      title,
      description,
      project_type: category,
      photos: image_url ? [image_url] : dummyPortfolios[projectIndex].photos,
      thumbnail_url: image_url || dummyPortfolios[projectIndex].thumbnail_url,
      completion_date: year ? `${year}-01-01` : dummyPortfolios[projectIndex].completion_date,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      project: dummyPortfolios[projectIndex] 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // 테스트용 삭제
    const projectIndex = dummyPortfolios.findIndex(p => p.id === projectId)
    if (projectIndex === -1) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    dummyPortfolios.splice(projectIndex, 1)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
