import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'
import type { DocsAdapter, DocArticle, CreateArticleInput, UpdateArticleInput } from '../types'

interface SQLiteAdapterOptions {
  dbPath?: string
}

export function createSQLiteAdapter(options: SQLiteAdapterOptions = {}): DocsAdapter {
  const db = new Database(options.dbPath ?? ':memory:')
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS doc_articles (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      body_md      TEXT NOT NULL,
      section      TEXT NOT NULL,
      article_order INTEGER NOT NULL,
      published_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_doc_articles_section_order ON doc_articles (section, article_order);
  `)

  function slugify(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  return {
    async list({ section, published } = {}) {
      let sql = 'SELECT * FROM doc_articles WHERE 1=1'
      const params: unknown[] = []

      if (section !== undefined) {
        sql += ' AND section = ?'
        params.push(section)
      }

      if (published === true) {
        sql += ' AND published_at IS NOT NULL'
      } else if (published === false) {
        sql += ' AND published_at IS NULL'
      }

      sql += ' ORDER BY section, article_order'

      const rows = db.prepare(sql).all(...params) as DocArticle[]
      return rows
    },

    async get(id: string): Promise<DocArticle | null> {
      const row = db.prepare('SELECT * FROM doc_articles WHERE id = ?').get(id) as DocArticle | undefined
      return row ?? null
    },

    async create(data: CreateArticleInput): Promise<DocArticle> {
      const id = nanoid()
      const published_at = data.published_at ?? null

      db.prepare(`
        INSERT INTO doc_articles (id, title, body_md, section, article_order, published_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.title, data.body_md, data.section, data.article_order, published_at)

      return { id, ...data, published_at }
    },

    async update(id: string, data: Partial<UpdateArticleInput>): Promise<DocArticle> {
      const existing = await this.get(id)
      if (!existing) {
        throw new Error(`Article not found: ${id}`)
      }

      const updated = { ...existing, ...data }

      db.prepare(`
        UPDATE doc_articles SET title = ?, body_md = ? WHERE id = ?
      `).run(updated.title, updated.body_md, id)

      return updated
    },

    async delete(id: string): Promise<void> {
      db.prepare('DELETE FROM doc_articles WHERE id = ?').run(id)
    },

    async reorder(id: string, newOrder: number): Promise<void> {
      db.prepare('UPDATE doc_articles SET article_order = ? WHERE id = ?').run(newOrder, id)
    },

    async moveSection(id: string, newSection: string): Promise<void> {
      db.prepare('UPDATE doc_articles SET section = ? WHERE id = ?').run(newSection, id)
    },
  }
}
