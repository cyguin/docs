export type { DocsAdapter, DocArticle } from './types.js';

export { createDocsHandler } from './handlers/route.js';
export { createAdminHandler, setAdminAdapter, setAdminSecret } from './handlers/admin.js';
