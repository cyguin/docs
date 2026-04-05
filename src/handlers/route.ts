import type { DocsAdapter } from '../types'

let _adapter: DocsAdapter | null = null

export function setDocsAdapter(adapter: DocsAdapter) {
  _adapter = adapter
}

export function getDocsAdapter(): DocsAdapter {
  if (!_adapter) {
    throw new Error('Docs adapter not set. Call setDocsAdapter() first.')
  }
  return _adapter
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function kebabToTitle(kebab: string): string {
  return kebab.replace(/-/g, ' ')
}

export function createDocsHandler(options: { adapter?: DocsAdapter }) {
  const adapter = options?.adapter ?? getDocsAdapter()

  return async function handler(
    req: Request,
    context?: { params?: Record<string, string | string[]> }
  ): Promise<Response> {
    const segments = (context?.params?.cyguin ?? []) as string[]

    if (req.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      if (segments.length === 0) {
        const articles = await adapter.list({ published: true })
        return Response.json(articles)
      }

      if (segments.length === 1) {
        const [section] = segments
        const articles = await adapter.list({ section, published: true })
        return Response.json(articles)
      }

      if (segments.length === 2) {
        const [section, slug] = segments
        const titleQuery = kebabToTitle(slug)
        const articles = await adapter.list({ section, published: true })
        const article = articles.find(
          (a) => slugify(a.title) === slug || a.title.toLowerCase() === titleQuery.toLowerCase()
        )

        if (!article) {
          return Response.json({ error: 'Article not found' }, { status: 404 })
        }

        return Response.json(article)
      }

      return Response.json({ error: 'Not found' }, { status: 404 })
    } catch (err) {
      console.error('Docs handler error:', err)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
