import { ZodSchema } from 'zod'
import { ApiErrors } from './error'

export async function parseJsonBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const json = await req.json()

  const result = schema.safeParse(json)
  if (!result.success) {
    throw ApiErrors.badRequest('입력 데이터가 올바르지 않습니다.')
  }

  return result.data
}

export function parseSearchParams<T>(
  url: string,
  schema: ZodSchema<T>
): T {
  const searchParams = Object.fromEntries(new URL(url).searchParams.entries())
  const result = schema.safeParse(searchParams)

  if (!result.success) {
    throw ApiErrors.badRequest('쿼리 파라미터가 올바르지 않습니다.')
  }

  return result.data
}

