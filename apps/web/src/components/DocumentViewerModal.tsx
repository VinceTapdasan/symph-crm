'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useGetDocumentContent } from '@/lib/hooks/queries'
import { useEscapeKey } from '@/lib/hooks/use-escape-key'
import type { ApiDocument } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Markdown if storagePath ends in .md, or tags include 'markdown'/'notes'.
 * Covers both inline notes (auto-derived .md path) and uploaded .md/.txt files.
 */
function isMarkdownDoc(doc: ApiDocument): boolean {
  if (doc.storagePath?.endsWith('.md')) return true
  if (doc.tags?.includes('markdown')) return true
  if (doc.tags?.includes('notes')) return true
  return false
}

/** Image if tags contain a known image extension */
function isImageDoc(doc: ApiDocument): boolean {
  return ['jpeg', 'jpg', 'png', 'webp', 'gif'].some(t => doc.tags?.includes(t))
}

/** Friendly type label from tags */
function getFileTypeLabel(doc: ApiDocument): string {
  if (!doc.tags?.length) return 'Note'
  const ext = doc.tags.find(t => !['notes', 'resources'].includes(t))
  return ext ? ext.toUpperCase() : 'Document'
}

// ── Component ─────────────────────────────────────────────────────────────────

type ViewMode = 'rendered' | 'raw'

type DocumentViewerModalProps = {
  doc: ApiDocument
  onClose: () => void
}

export function DocumentViewerModal({ doc, onClose }: DocumentViewerModalProps) {
  const isMarkdown = isMarkdownDoc(doc)
  const isImage = isImageDoc(doc)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered')

  // Fetch content for all non-image documents (text, extracted PDF text, etc.)
  const { data, isLoading } = useGetDocumentContent(!isImage ? doc.id : null)

  useEscapeKey(useCallback(onClose, [onClose]))

  const content = data?.content ?? ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1d21] rounded-xl shadow-2xl border border-black/[.08] dark:border-white/[.08] w-[90vw] max-w-[780px] max-h-[85vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-black/[.06] dark:border-white/[.08] shrink-0">
          {/* File icon */}
          <div className="text-slate-400 shrink-0">
            {isImage ? (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            ) : (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">
              {doc.title}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{getFileTypeLabel(doc)}</span>
              <span>·</span>
              <span>{new Date(doc.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {doc.wordCount != null && doc.wordCount > 0 && (
                <>
                  <span>·</span>
                  <span>{doc.wordCount} words</span>
                </>
              )}
            </div>
          </div>

          {/* Rendered / Raw toggle — only for markdown */}
          {isMarkdown && (
            <div className="flex items-center bg-slate-100 dark:bg-white/[.06] rounded-lg p-0.5 gap-0.5 shrink-0">
              <button
                onClick={() => setViewMode('rendered')}
                className={`h-[26px] px-3 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'rendered'
                    ? 'bg-white dark:bg-[#1e1e21] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                }`}
              >
                Rendered
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`h-[26px] px-3 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-[#1e1e21] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                }`}
              >
                Raw
              </button>
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[.08] transition-colors shrink-0"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : isImage ? (
            /* Images require signed URL — not available without Supabase configured */
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 px-6">
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="opacity-30">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-[12px] text-center">Image preview requires Supabase Storage</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center">
                Add SUPABASE_SERVICE_ROLE_KEY to enable inline previews
              </p>
            </div>
          ) : !content ? (
            /* No content — storage may not be configured */
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400 px-6">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="opacity-30">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {doc.excerpt ? (
                <div className="text-center max-w-[480px]">
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-1">Preview (excerpt)</p>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{doc.excerpt}</p>
                </div>
              ) : (
                <>
                  <p className="text-[12px]">Content not available</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600">Enable Supabase Storage to view full content</p>
                </>
              )}
            </div>
          ) : isMarkdown && viewMode === 'rendered' ? (
            /* Rendered markdown with typography plugin */
            <div className="px-7 py-6 prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white
              prose-p:text-slate-700 dark:prose-p:text-slate-300
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-50 dark:prose-pre:bg-white/[.04] prose-pre:border prose-pre:border-black/[.06] dark:prose-pre:border-white/[.08]
              prose-blockquote:border-primary/40 prose-blockquote:text-slate-500
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-th:text-slate-700 dark:prose-th:text-slate-300
              prose-td:text-slate-600 dark:prose-td:text-slate-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            /* Raw / plain text — mono font, whitespace preserved */
            <pre className="px-7 py-6 text-[12px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
