import { createAdminHandler } from '../../../../handlers/admin'

const handler = createAdminHandler({})

export async function POST(
  request: Request,
  context: { params?: Record<string, string | string[]> }
) {
  return handler(request, context)
}

export async function PUT(
  request: Request,
  context: { params?: Record<string, string | string[]> }
) {
  return handler(request, context)
}

export async function PATCH(
  request: Request,
  context: { params?: Record<string, string | string[]> }
) {
  return handler(request, context)
}

export async function DELETE(
  request: Request,
  context: { params?: Record<string, string | string[]> }
) {
  return handler(request, context)
}
