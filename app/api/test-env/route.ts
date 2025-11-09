import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '누락됨'
    }
    
    if (process.env.NODE_ENV === 'development') console.log('환경 변수 상태:', envCheck)
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: '환경 변수 확인 완료'
    })
    
  } catch (error) {
    console.error('환경 변수 확인 오류:', error)
    return NextResponse.json(
      { error: '환경 변수 확인 실패', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
