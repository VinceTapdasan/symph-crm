# Proposal PDF Generation — Strategy (Deferred)

**Status:** Deferred. HTML-only proposals shipped first. Revisit when client-facing PDF download is required (signed contracts, offline review, pricing handouts).

This document captures the decisions and trade-offs already discussed so we don't relitigate them when we revisit.

---

## When we'll need this

- Client clicks "Download PDF" from a share link.
- AM exports a versioned PDF to attach to a Gmail thread.
- A signed/locked PDF artifact is needed alongside the editable HTML source (audit / legal trail).

Until any of those land, the iframe-rendered HTML is enough. Browsers print to PDF natively; clients who insist can use that.

---

## Storage shape (when implemented)

```
proposal_versions row (in `documents` table)
  + pdf_storage_path text   ← null until first generation
                              null again whenever HTML changes (invalidate)

Supabase Storage `attachments` bucket
  proposals/{versionId}.pdf  ← keyed by version, NEVER by proposal — so it
                                stays in sync with the exact HTML it was
                                rendered from
```

Key invariant: **PDF cache key = `versionId`**, not `proposalId`. Saving a new version does not invalidate old PDFs (v3.pdf is still the rendering of v3 even after v4 exists).

---

## Generation strategy

### Recommended: Puppeteer in-container

Run headless Chromium in the API container. Trigger generation:
- **Lazy** — first time the PDF is requested (cache-on-demand).
- **Eager** — optional, on every save, if AMs commonly export immediately. Skip for now.

```ts
// PdfService skeleton (when we build it)
export class PdfService {
  async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      return await page.pdf({ format: 'A4', printBackground: true })
    } finally {
      await browser.close()
    }
  }
}
```

Trade-offs accepted:
- **Image size**: +150MB Chromium in the container. Cold start hit on Cloud Run (~3–5s extra).
- **Memory**: Chromium needs ~512MB minimum during render. Tune Cloud Run instance size if cold starts spike.
- **Sandbox**: `--no-sandbox` is required on Cloud Run (no user namespaces). Acceptable since we control the input HTML and strip scripts at the public render path.

### Alternatives considered

| Option | Why we passed |
|---|---|
| `@react-pdf/renderer` | Doesn't render arbitrary HTML — would force every proposal into a React component tree. Sample HTML uses custom CSS, fonts, `@page A4` — unreplicable. |
| Browserless / PDFShift | Per-render cost, network hop, vendor lock. Reserve for if Cloud Run Chromium becomes painful. |
| Client-side `html2pdf.js` | Font fidelity is poor, complex CSS breaks, Geist + custom `@page` rules don't render reliably. Unsuitable for client-facing output. |
| Save HTML through a "Print to PDF" UI step | Manual, breaks the share-link flow. |

If we ever hit Chromium pain on Cloud Run, swap to Browserless behind the same `PdfService` interface. Keep the abstraction so the swap is a one-file change.

---

## Service interface (write to this when we revisit)

```ts
// apps/api/src/proposals/pdf.service.ts
@Injectable()
export class PdfService {
  /** Render HTML to a PDF Buffer. Implementation: Puppeteer or external. */
  async renderHtmlToPdf(html: string): Promise<Buffer>
}

// apps/api/src/proposals/proposals.service.ts (added method)
async getOrGeneratePdf(versionId: string): Promise<{ url: string }> {
  const version = await this.findVersion(versionId)
  if (version.pdfStoragePath) {
    return { url: await this.storage.attachmentSignedUrl(version.pdfStoragePath) }
  }
  const html = await this.storage.readMarkdown(version.storagePath) // HTML lives here
  const pdfBuffer = await this.pdfService.renderHtmlToPdf(stripScripts(html))
  const pdfPath = `proposals/${version.id}.pdf`
  await this.storage.uploadAttachment(pdfPath, pdfBuffer, 'application/pdf')
  await this.db.update(documents).set({ pdfStoragePath: pdfPath }).where(eq(documents.id, version.id))
  return { url: await this.storage.attachmentSignedUrl(pdfPath) }
}
```

---

## Schema delta (when we add this)

```ts
// packages/database/src/schema/documents.ts
pdfStoragePath: text('pdf_storage_path'),  // null until first PDF generation
```

Boot migration:
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
```

Cache invalidation: every new version is a new row, so old `pdfStoragePath` values are untouched and remain valid for their own version. Nothing to invalidate on save.

---

## What gets stripped before rendering to PDF

Same as the public share-link render: all `<script>` tags and inline event handlers. PDF should be a static visual artifact with no executable content. Our share-link controller already strips this for the public HTML path; PDF path reuses the same stripper.

---

## Open questions for revisit time

- Should generation be lazy (on first request) or eager (on save)? Default: lazy. Reconsider if AMs always export immediately.
- Page-break CSS hints (`break-inside: avoid`) — will the existing proposal templates need additions, or do we leave it to the author?
- Watermark for unsigned vs signed PDF copies? (e.g. "DRAFT" overlay on shares before client signs.)

---

**TL;DR for future me:** Add Puppeteer to the API container. Lazy-generate PDFs on first share-link / download click. Cache by `versionId` in Supabase Storage. Strip scripts before rendering. Keep the `PdfService` abstraction so we can swap Browserless in if Cloud Run gets painful.
