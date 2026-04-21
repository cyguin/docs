import { describe, expect, it, vi } from 'vitest';
import { createAdminHandler } from './admin';
import type { DocsAdapter } from '../types';

function adapter(): DocsAdapter {
  return {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn().mockResolvedValue({
      id: 'doc_1',
      title: 'Install',
      body_md: 'Run npm install.',
      section: 'Start',
      article_order: 1,
      published_at: null,
    }),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    moveSection: vi.fn(),
  };
}

describe('createAdminHandler auth', () => {
  it('fails closed when no admin secret is configured', async () => {
    const docsAdapter = adapter();
    const handler = createAdminHandler({ adapter: docsAdapter });

    const response = await handler(new Request('https://example.com/api/docs', { method: 'POST' }), {
      params: { route: [] },
    });

    expect(response.status).toBe(500);
    expect(docsAdapter.create).not.toHaveBeenCalled();
  });

  it('rejects invalid bearer tokens', async () => {
    const docsAdapter = adapter();
    const handler = createAdminHandler({ adapter: docsAdapter, secret: 'admin-secret' });

    const response = await handler(
      new Request('https://example.com/api/docs', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong' },
      }),
      { params: { route: [] } }
    );

    expect(response.status).toBe(401);
    expect(docsAdapter.create).not.toHaveBeenCalled();
  });
});
