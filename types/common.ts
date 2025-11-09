export type UUID = string

export type Timestamp = string

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export interface Result<T, E = string> {
  success: boolean
  data?: T
  error?: E
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | { success: false; error: ApiError }

