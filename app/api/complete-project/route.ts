import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    console.log('Complete project API called with:', { projectId })

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing project ID' },
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

    console.log('Updating project status to completed:', projectId)
    
    // 프로젝트 상태만 업데이트 (가장 중요한 부분)
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

    console.log('Successfully updated project to completed:', projectData)
    return NextResponse.json({ 
      success: true, 
      message: 'Project marked as completed',
      data: projectData 
    })

  } catch (error) {
    console.error('Complete project API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
