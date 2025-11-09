// lib/supabase/quotes.ts
import { createBrowserClient } from '@/lib/supabase/clients'

// 데이터 변환 함수
function transformQuoteToRequest(quote: any) {
  return {
    ...quote,
    customer_id: quote.customer_id,
    project_types: quote.project_types || [],
    description: quote.details?.description || '',
    photos: quote.details?.photos || [],
    visit_date: quote.visit_dates?.[0] || null
  }
}

export async function getQuoteRequests(userId: string) {
  const supabase = createBrowserClient()
  
  // 1차: quote_requests 테이블 시도
  let { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  
  // 2차: quotes 테이블 폴백 (테이블 없음 오류 시)
  if (error?.code === '42P01') { // 테이블 없음
    if (process.env.NODE_ENV === 'development') console.log('Falling back to quotes table')
    const quotesResult = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
    
    // 데이터 형식 변환
    if (quotesResult.data) {
      data = quotesResult.data.map(transformQuoteToRequest)
      error = quotesResult.error
    }
  }
  
  return { data, error }
}

export async function createQuoteRequest(quoteData: any) {
  const supabase = createBrowserClient()
  
  // 1차: quote_requests 테이블 시도
  let { data, error } = await supabase
    .from('quote_requests')
    .insert(quoteData)
    .select()
    .single()
  
  // 2차: quotes 테이블 폴백
  if (error?.code === '42P01') { // 테이블 없음
    if (process.env.NODE_ENV === 'development') console.log('Falling back to quotes table for insert')
    
    // quote_requests 형식을 quotes 형식으로 변환
    const transformedData = {
      ...quoteData,
      details: {
        description: quoteData.description || '',
        photos: quoteData.photos || []
      },
      visit_dates: quoteData.visit_date ? [quoteData.visit_date] : []
    }
    
    const quotesResult = await supabase
      .from('quotes')
      .insert(transformedData)
      .select()
      .single()
    
    if (quotesResult.data) {
      data = transformQuoteToRequest(quotesResult.data)
      error = quotesResult.error
    }
  }
  
  return { data, error }
}

// 테이블 존재 여부 확인
export async function checkTableExists(tableName: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', tableName)
    .single()
  
  return { exists: !!data, error }
}

// RLS 정책 확인
export async function checkRLSPolicies(tableName: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, permissive, roles, cmd, qual')
    .eq('tablename', tableName)
  
  return { data, error }
}
