import { createBrowserClient } from '@/lib/supabase/clients'

export class ApiClientError extends Error {
  status: number
  code?: string
  payload?: unknown
  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null

function mergeInit(defaults: RequestInit, init?: RequestInit): RequestInit {
  return {
    ...defaults,
    ...init,
    headers: {
      ...(defaults.headers || {}),
      ...(init?.headers || {}),
    },
  }
}

async function parseJsonSafe<T = any>(res: Response): Promise<T | undefined> {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return (await res.json()) as T
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Low-level request helper that:
 * - Includes cookies (credentials: 'include')
 * - Adds Authorization: Bearer <access_token> when available
 * - Throws ApiClientError with HTTP status and optional code
 */
export async function apiRequest<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  const request = mergeInit(
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    },
    init
  )

  const res = await fetch(url, request)
  const data = await parseJsonSafe<T>(res)

  if (!res.ok) {
    const message =
      (data as any)?.error ||
      (data as any)?.message ||
      `Request failed with status ${res.status}`
    const code = (data as any)?.code
    throw new ApiClientError(message, res.status, code, data)
  }

  return (data as T) ?? ({} as T)
}

export async function apiPost<T = any>(url: string, body?: Json, init?: RequestInit): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(init || {}),
  })
}

export async function apiGet<T = any>(url: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(url, {
    method: 'GET',
    ...(init || {}),
  })
}

export async function apiPut<T = any>(url: string, body?: Json, init?: RequestInit): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(init || {}),
  })
}

export async function apiDelete<T = any>(url: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(url, {
    method: 'DELETE',
    ...(init || {}),
  })
}
