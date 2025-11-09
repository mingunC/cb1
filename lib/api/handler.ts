import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, HttpMethod } from './types'
import { ApiError } from './types'
import { errorResponse } from './response'

type RouteHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse<ApiResponse>>

interface RouteHandlers {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  PATCH?: RouteHandler
  DELETE?: RouteHandler
}

export function createApiHandler(handlers: RouteHandlers) {
  return async (req: NextRequest, context?: unknown) => {
    const method = req.method as HttpMethod
    const handler = handlers[method]

    if (!handler) {
      return errorResponse('Method not allowed', 405)
    }

    try {
      return await handler(req, context)
    } catch (error) {
      console.error(`API Error [${method}]:`, error)

      if (error instanceof ApiError) {
        return errorResponse(error.message, error.statusCode, error.code)
      }

      return errorResponse('An unexpected error occurred', 500, 'INTERNAL_ERROR')
    }
  }
}

