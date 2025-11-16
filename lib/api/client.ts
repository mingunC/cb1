import { createBrowserClient } from '@/lib/supabase/clients'

/**
 * API 요청을 위한 헬퍼 함수
 * 자동으로 Authorization 헤더를 추가합니다
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createBrowserClient()
  
  // 현재 세션에서 access token 가져오기
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Authorization 헤더 추가
  const headers = new Headers(options.headers)
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  
  headers.set('Content-Type', 'application/json')

  // 요청 실행
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * POST 요청 헬퍼
 */
export async function apiPost<T = any>(url: string, data: any): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * GET 요청 헬퍼
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, {
    method: 'GET',
  })
}

/**
 * PUT 요청 헬퍼
 */
export async function apiPut<T = any>(url: string, data: any): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 요청 헬퍼
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, {
    method: 'DELETE',
  })
}
