import { ApiError } from './types'

export const ApiErrors = {
  unauthorized: () => new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'),
  forbidden: () => new ApiError(403, 'Forbidden', 'FORBIDDEN'),
  notFound: (resource: string) => new ApiError(404, `${resource} not found`, 'NOT_FOUND'),
  badRequest: (message: string) => new ApiError(400, message, 'BAD_REQUEST'),
  internal: (message: string = 'Internal server error') => new ApiError(500, message, 'INTERNAL_ERROR'),
} as const

