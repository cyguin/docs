# @cyguin/docs

Embeddable help and documentation widget for Next.js — renders searchable, markdown-backed docs as a modal or sidebar overlay.

## Quickstart

```bash
npm install @cyguin/docs
```

### 1. Add the widget to your app

```tsx
// app/layout.tsx (or any page)
import { DocsWidget } from '@cyguin/docs';
import '@cyguin/docs/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <DocsWidget apiUrl="/api/docs" mode="modal" triggerLabel="Help" />
      </body>
    </html>
  );
}
```

### 2. Wire up the API route

```ts
// app/api/docs/[...cyguin]/route.ts
import { createDocsHandler } from '@cyguin/docs/next';
import { createSQLiteAdapter } from '@cyguin/docs/adapters/sqlite';

const adapter = createSQLiteAdapter({ path: './docs.db' });
export const GET = createDocsHandler({ adapter });
```

### 3. Seed some articles

```ts
import { createDocsHandler } from '@cyguin/docs/next';
import { createSQLiteAdapter } from '@cyguin/docs/adapters/sqlite';

const adapter = createSQLiteAdapter({ path: './docs.db' });
const handler = createDocsHandler({ adapter });

// POST /admin/docs — create article
await handler.request(new Request('http://localhost/admin/docs', {
  method: 'POST',
  headers: { 'x-secret': 'your-secret', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Getting Started',
    body_md: '# Getting Started\n\nWelcome to **My App**!',
    section: 'Introduction',
    article_order: 1,
  }),
}));
```

## Modes

### Modal (default)
Floating corner button opens a centered overlay with backdrop. Click backdrop or press `Esc` to close.

```tsx
<DocsWidget mode="modal" triggerLabel="Help" />
```

### Sidebar
Panel slides in from the right edge. Good for persistent help panels.

```tsx
<DocsWidget mode="sidebar" triggerLabel="Docs" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiUrl` | `string` | `"/api/docs"` | Endpoint that returns article list |
| `mode` | `"modal" \| "sidebar"` | `"modal"` | Widget display mode |
| `triggerLabel` | `string` | `"Help"` | Label shown on the floating trigger button |
| `defaultOpen` | `boolean` | `false` | Open on mount |
| `className` | `string` | `""` | CSS class on root element |

## API Contract

The `apiUrl` must return a JSON array of articles:

```json
[
  {
    "id": "1",
    "title": "Getting Started",
    "body_md": "# Getting Started\n\nWelcome...",
    "section": "Introduction",
    "article_order": 1,
    "published_at": 1710000000
  }
]
```

`GET /api/docs` from `@cyguin/docs/next` returns this shape automatically.

## Theming

All colors use `--cyguin-*` CSS custom properties. Override on your root element or `:root`:

```css
:root {
  --cyguin-bg: #ffffff;
  --cyguin-bg-subtle: #f5f5f5;
  --cyguin-border: #e5e5e5;
  --cyguin-border-focus: #f5a800;
  --cyguin-fg: #0a0a0a;
  --cyguin-fg-muted: #888888;
  --cyguin-accent: #f5a800;
  --cyguin-accent-dark: #c47f00;
  --cyguin-accent-fg: #0a0a0a;
  --cyguin-radius: 6px;
  --cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `/` | Focus search input |
| `Esc` | Close widget |
| `↑` / `↓` | Navigate article list |
| `Enter` | Open selected article |

## Exports

### `@cyguin/docs`
| Export | Type | Description |
|--------|------|-------------|
| `DocsWidget` | Component | Searchable docs widget (modal/sidebar) |
| `DocsWidgetProps` | Interface | Component props |
| `DocArticle` | Interface | Article shape |
| `defaultCssVars` | Object | Default CSS variable values |

### `@cyguin/docs/next`
| Export | Type | Description |
|--------|------|-------------|
| `createDocsHandler` | Function | Factory for Next.js API route handler |
| `DocsAdapter` | Interface | Storage adapter contract |
| `DocArticle` | Interface | Article shape |
