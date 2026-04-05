'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import type { DocArticle, DocsWidgetProps } from '../types.js';

marked.setOptions({ breaks: true, gfm: true });

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ChevronRightIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

interface ArticleGroup {
  section: string;
  articles: DocArticle[];
}

function groupBySection(articles: DocArticle[]): ArticleGroup[] {
  const map = new Map<string, DocArticle[]>();
  for (const article of articles) {
    const list = map.get(article.section) ?? [];
    list.push(article);
    map.set(article.section, list);
  }
  return Array.from(map.entries())
    .map(([section, arts]) => ({ section, articles: arts.sort((a, b) => a.article_order - b.article_order) }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

interface DocsTriggerProps {
  label: string;
  onClick: () => void;
}

function DocsTrigger({ label, onClick }: DocsTriggerProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9998,
        width: '48px',
        height: '48px',
        borderRadius: 'var(--cyguin-docs-radius)',
        background: 'var(--cyguin-docs-accent)',
        color: 'var(--cyguin-accent-fg, #0a0a0a)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--cyguin-docs-shadow)',
        fontWeight: 600,
        fontSize: '14px',
        fontFamily: 'var(--cyguin-docs-font)',
        transition: 'opacity 0.15s',
      }}
    >
      <HelpIcon />
    </button>
  );
}

interface DocsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function DocsSearch({ value, onChange }: DocsSearchProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        const widget = document.getElementById('cyguin-docs-widget');
        if (active && widget?.contains(active)) return;
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ position: 'relative', padding: '12px 12px 8px' }}>
      <SearchIcon />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search docs... (press / to focus)"
        aria-label="Search documentation"
        style={{
          width: '100%',
          padding: '8px 8px 8px 32px',
          borderRadius: 'var(--cyguin-docs-radius)',
          border: '1px solid var(--cyguin-docs-border)',
          background: 'var(--cyguin-bg-subtle, #f5f5f5)',
          color: 'var(--cyguin-docs-text)',
          fontSize: '14px',
          fontFamily: 'var(--cyguin-docs-font)',
          boxSizing: 'border-box',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--cyguin-border-focus, #f5a800)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--cyguin-docs-border)'; }}
      />
    </div>
  );
}

interface DocsNavProps {
  groups: ArticleGroup[];
  selectedId: string | null;
  selectedIndex: number;
  onSelectArticle: (id: string, index: number) => void;
  searchQuery: string;
}

function DocsNav({ groups, selectedId, selectedIndex, onSelectArticle, searchQuery }: DocsNavProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(groups.map((g) => g.section)));
  const navRef = useRef<HTMLDivElement>(null);
  const flatArticles = groups.flatMap((g) => g.articles);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    activeIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(activeIndexRef.current + 1, flatArticles.length - 1);
        onSelectArticle(flatArticles[next].id, next);
        scrollToSelected(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(activeIndexRef.current - 1, 0);
        onSelectArticle(flatArticles[prev].id, prev);
        scrollToSelected(prev);
      } else if (e.key === 'Enter' && selectedId) {
        e.preventDefault();
        const idx = flatArticles.findIndex((a) => a.id === selectedId);
        if (idx !== -1) onSelectArticle(selectedId, idx);
      }
    };
    const widget = document.getElementById('cyguin-docs-widget');
    widget?.addEventListener('keydown', handler);
    return () => widget?.removeEventListener('keydown', handler);
  }, [flatArticles, selectedId, onSelectArticle]);

  function scrollToSelected(index: number) {
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>('[data-article-btn]');
    buttons?.[index]?.scrollIntoView({ block: 'nearest' });
  }

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  let articleIdx = 0;
  return (
    <div ref={navRef} style={{ overflowY: 'auto', flex: 1, borderRight: '1px solid var(--cyguin-docs-border)' }}>
      {groups.length === 0 && (
        <p style={{ padding: '16px', color: 'var(--cyguin-docs-muted)', fontSize: '13px', textAlign: 'center', fontFamily: 'var(--cyguin-docs-font)' }}>
          {searchQuery ? 'No results found' : 'No articles yet'}
        </p>
      )}
      {groups.map((group) => {
        const isExpanded = expandedSections.has(group.section);
        return (
          <div key={group.section}>
            <button
              onClick={() => toggleSection(group.section)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--cyguin-docs-text)',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--cyguin-docs-font)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <ChevronRightIcon expanded={isExpanded} />
              {group.section}
            </button>
            {isExpanded &&
              group.articles.map((article) => {
                const idx = articleIdx++;
                const isSelected = article.id === selectedId;
                return (
                  <button
                    key={article.id}
                    data-article-btn
                    onClick={() => onSelectArticle(article.id, idx)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 28px',
                      background: isSelected ? 'var(--cyguin-docs-accent)' : 'none',
                      color: isSelected ? 'var(--cyguin-accent-fg, #0a0a0a)' : 'var(--cyguin-docs-text)',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontFamily: 'var(--cyguin-docs-font)',
                      borderRadius: 'var(--cyguin-docs-radius)',
                      margin: '1px 6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {article.title}
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

interface DocsArticleViewProps {
  article: DocArticle | null;
  onBack: () => void;
}

function DocsArticleView({ article, onBack }: DocsArticleViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  if (!article) {
    return (
      <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyguin-docs-muted)', fontSize: '14px', fontFamily: 'var(--cyguin-docs-font)' }}>
        Select an article to read
      </div>
    );
  }

  return (
    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cyguin-docs-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onBack}
          aria-label="Back to list"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyguin-docs-muted)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: 'var(--cyguin-docs-radius)' }}
        >
          <BackIcon />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyguin-docs-text)', fontFamily: 'var(--cyguin-docs-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.title}
        </span>
      </div>
      <div
        ref={contentRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontSize: '14px', lineHeight: 1.7, color: 'var(--cyguin-docs-text)', fontFamily: 'var(--cyguin-docs-font)' }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body_md) }}
      />
    </div>
  );
}

interface DocsPanelProps {
  mode: 'modal' | 'sidebar';
  open: boolean;
  onClose: () => void;
  groups: ArticleGroup[];
  selectedId: string | null;
  selectedIndex: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectArticle: (id: string, index: number) => void;
  onBack: () => void;
  article: DocArticle | null;
}

function DocsPanel({ mode, open, onClose, groups, selectedId, selectedIndex, searchQuery, onSearchChange, onSelectArticle, onBack, article }: DocsPanelProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: isMobile ? '100vw' : mode === 'sidebar' ? '420px' : '680px',
    maxWidth: '100vw',
    background: 'var(--cyguin-docs-bg)',
    borderRadius: mode === 'sidebar' || isMobile ? 0 : 'var(--cyguin-docs-radius)',
    boxShadow: mode === 'modal' ? 'var(--cyguin-docs-shadow)' : 'none',
    border: mode === 'modal' && !isMobile ? '1px solid var(--cyguin-docs-border)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'var(--cyguin-docs-font)',
  };

  if (!open) return null;

  return (
    <>
      {mode === 'modal' && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: `rgba(0, 0, 0, ${parseFloat(String(0.5))})`,
            zIndex: 9998,
          }}
          aria-hidden="true"
        />
      )}
      <div id="cyguin-docs-widget" role="dialog" aria-modal={mode === 'modal'} aria-label="Documentation" style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 8px', borderBottom: '1px solid var(--cyguin-docs-border)' }}>
          <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', color: 'var(--cyguin-docs-text)', fontFamily: 'var(--cyguin-docs-font)' }}>Help Center</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyguin-docs-muted)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: 'var(--cyguin-docs-radius)' }}
          >
            <CloseIcon />
          </button>
        </div>
        <DocsSearch value={searchQuery} onChange={onSearchChange} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: isMobile ? '100%' : '180px', display: 'flex', flexDirection: 'column' }}>
            <DocsNav
              groups={groups}
              selectedId={selectedId}
              selectedIndex={selectedIndex}
              onSelectArticle={onSelectArticle}
              searchQuery={searchQuery}
            />
          </div>
          {!isMobile && <DocsArticleView article={article} onBack={onBack} />}
          {isMobile && article && <DocsArticleView article={article} onBack={onBack} />}
        </div>
      </div>
    </>
  );
}

export function DocsWidget({
  apiUrl = '/api/docs',
  mode = 'modal',
  triggerLabel = 'Help',
  defaultOpen = false,
  className = '',
}: DocsWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [articles, setArticles] = useState<DocArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);

  useEffect(() => {
    if (open && articles.length === 0) {
      setLoading(true);
      fetch(apiUrl)
        .then((r) => r.json())
        .then((data) => {
          const arts: DocArticle[] = Array.isArray(data) ? data : data.articles ?? data.data ?? [];
          setArticles(arts);
        })
        .catch(() => setArticles([]))
        .finally(() => setLoading(false));
    }
  }, [open, apiUrl, articles.length]);

  useEffect(() => {
    if (selectedId) {
      const art = articles.find((a) => a.id === selectedId);
      setSelectedArticle(art ?? null);
    } else {
      setSelectedArticle(null);
    }
  }, [selectedId, articles]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedId(null);
    setSelectedIndex(0);
    setSelectedArticle(null);
  }, []);

  const handleSelectArticle = useCallback((id: string, index: number) => {
    setSelectedId(id);
    setSelectedIndex(index);
    const art = articles.find((a) => a.id === id);
    setSelectedArticle(art ?? null);
  }, [articles]);

  const handleBack = useCallback(() => {
    setSelectedId(null);
    setSelectedArticle(null);
  }, []);

  const filteredArticles = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.body_md.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : articles;

  const groups = groupBySection(filteredArticles);

  return (
    <>
      <div className={className} style={{ fontFamily: 'var(--cyguin-docs-font)' }}>
        <DocsTrigger label={triggerLabel} onClick={() => setOpen(true)} />
        <DocsPanel
          mode={mode}
          open={open}
          onClose={() => setOpen(false)}
          groups={groups}
          selectedId={selectedId}
          selectedIndex={selectedIndex}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSelectArticle={handleSelectArticle}
          onBack={handleBack}
          article={selectedArticle}
        />
      </div>
    </>
  );
}
