import type { DocsAdapter, DocsHandlerOptions, NextHandler } from '../types'

let _adapter: DocsAdapter | null = null
let _secret: string | undefined = undefined

export function setAdminAdapter(adapter: DocsAdapter) {
  _adapter = adapter
}

export function setAdminSecret(secret: string) {
  _secret = secret
}

export function getAdminAdapter(): DocsAdapter {
  if (!_adapter) {
    throw new Error('Admin adapter not set. Call setAdminAdapter() first.')
  }
  return _adapter
}

export function createAdminHandler(options?: DocsHandlerOptions) {
  const adapter = options?.adapter ?? getAdminAdapter()
  const secret = options?.secret ?? _secret

  return async function handler(
    req: Request,
    context?: { params?: Record<string, string | string[]> }
  ): Promise<Response> {
    if (!secret) {
      return Response.json({ error: 'Admin secret is not configured' }, { status: 500 })
    }

    const authHeader = req.headers.get('Authorization')
    const expected = `Bearer ${secret}`
    if (authHeader !== expected) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathParts = (context?.params?.route ?? []) as string[]
    const method = req.method

    try {
      if (pathParts.length === 0 && method === 'POST') {
        const body = await req.json()
        const article = await adapter.create({
          title: body.title,
          body_md: body.body_md,
          section: body.section,
          article_order: body.article_order,
          published_at: body.published_at ?? null,
        })
        return Response.json(article, { status: 201 })
      }

      if (pathParts.length === 1 && method === 'PUT') {
        const [id] = pathParts
        const body = await req.json()
        const article = await adapter.update(id, body)
        return Response.json(article)
      }

      if (pathParts.length === 2) {
        const [id, action] = pathParts

        if (action === 'order' && method === 'PATCH') {
          const body = await req.json()
          await adapter.reorder(id, body.article_order)
          return Response.json({ success: true })
        }

        if (action === 'section' && method === 'PATCH') {
          const body = await req.json()
          await adapter.moveSection(id, body.section)
          return Response.json({ success: true })
        }
      }

      if (pathParts.length === 1 && method === 'DELETE') {
        const [id] = pathParts
        await adapter.delete(id)
        return Response.json({ success: true })
      }

      return Response.json({ error: 'Not found' }, { status: 404 })
    } catch (err) {
      console.error('Admin handler error:', err)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  } as NextHandler
}
