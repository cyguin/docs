import { createDocsHandler } from '../../../../handlers/route'

const handler = createDocsHandler({})

export async function GET(
  request: Request,
  context: { params?: Record<string, string | string[]> }
) {
  return handler(request, context)
}
