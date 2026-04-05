export interface DocArticle {
  id: string
  title: string
  body_md: string
  section: string
  article_order: number
  published_at: number | null
}

export interface CreateArticleInput {
  title: string
  body_md: string
  section: string
  article_order: number
  published_at?: number | null
}

export interface UpdateArticleInput {
  title?: string
  body_md?: string
}

export interface DocsAdapter {
  list(params?: { section?: string; published?: boolean }): Promise<DocArticle[]>
  get(id: string): Promise<DocArticle | null>
  create(data: CreateArticleInput): Promise<DocArticle>
  update(id: string, data: Partial<UpdateArticleInput>): Promise<DocArticle>
  delete(id: string): Promise<void>
  reorder(id: string, newOrder: number): Promise<void>
  moveSection(id: string, newSection: string): Promise<void>
}

export interface DocsHandlerOptions {
  adapter?: DocsAdapter
  secret?: string
}

export type NextHandler = (
  req: Request,
  context?: { params?: Record<string, string | string[]> }
) => Promise<Response>

export interface DocsWidgetProps {
  apiUrl?: string
  mode?: 'modal' | 'sidebar'
  triggerLabel?: string
  defaultOpen?: boolean
  className?: string
}

export const defaultCssVars = {
  '--cyguin-docs-bg': 'var(--cyguin-surface, #ffffff)',
  '--cyguin-docs-text': 'var(--cyguin-text, #1a1a1a)',
  '--cyguin-docs-border': 'var(--cyguin-border, #e5e5e5)',
  '--cyguin-docs-accent': 'var(--cyguin-primary, #6366f1)',
  '--cyguin-docs-muted': 'var(--cyguin-muted, #737373)',
  '--cyguin-docs-backdrop-opacity': '0.5',
  '--cyguin-docs-radius': 'var(--cyguin-radius, 8px)',
  '--cyguin-docs-shadow': 'var(--cyguin-shadow, 0 4px 24px rgba(0,0,0,0.12))',
  '--cyguin-docs-trigger-size': '48px',
  '--cyguin-docs-font': 'var(--cyguin-font, system-ui, sans-serif)',
} as const
