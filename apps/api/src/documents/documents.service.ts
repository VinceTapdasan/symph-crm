import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { documents } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'
import { StorageService, CONTENT_BUCKET, ATTACHMENTS_BUCKET } from '../storage/storage.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

export type DocumentType = typeof documents.$inferInsert['type']

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DB) private db: Database,
    private storage: StorageService,
    private auditLogs: AuditLogsService,
  ) {}

  // ── Metadata queries ──────────────────────────────────────────────────────

  async findByDeal(dealId: string) {
    return this.db
      .select()
      .from(documents)
      .where(and(eq(documents.dealId, dealId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.updatedAt))
  }

  async findByCompany(companyId: string) {
    return this.db
      .select()
      .from(documents)
      .where(and(eq(documents.companyId, companyId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.updatedAt))
  }

  async findByType(type: any) {
    return this.db
      .select()
      .from(documents)
      .where(and(eq(documents.type, type), isNull(documents.deletedAt)))
      .orderBy(desc(documents.updatedAt))
  }

  async findOne(id: string) {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, id))
    return doc
  }

  // ── Content read/write ────────────────────────────────────────────────────

  /**
   * Read the full markdown content from Supabase Storage.
   * Returns null if the file doesn't exist yet.
   */
  async readContent(id: string): Promise<string | null> {
    const doc = await this.findOne(id)
    if (!doc) throw new NotFoundException(`Document ${id} not found`)
    return this.storage.readMarkdown(doc.storagePath)
  }

  /**
   * Create a document metadata record + write content to Storage.
   * storagePath is derived automatically if not provided:
   *   deals/{dealId}/{type}.md  |  companies/{companyId}/profile.md  |  etc.
   */
  async create(
    data: Omit<typeof documents.$inferInsert, 'storagePath' | 'excerpt' | 'wordCount'> & {
      storagePath?: string
      content?: string
    },
    performedBy?: string,
  ) {
    const { content, ...rest } = data

    // Auto-derive storage path if not supplied
    const storagePath = rest.storagePath ?? this.derivePath(rest)

    let excerpt: string | undefined
    let wordCount = 0
    if (content) {
      const extracted = StorageService.extractExcerpt(content)
      excerpt = extracted.excerpt
      wordCount = extracted.wordCount
      await this.storage.writeMarkdown(storagePath, content)
    }

    const [doc] = await this.db
      .insert(documents)
      .values({ ...rest, storagePath, excerpt, wordCount })
      .returning()

    // Audit every document creation (proposals get a distinct auditType)
    this.auditLogs.log({
      action: 'create',
      auditType: doc.type === 'proposal' ? 'proposal_created' : 'document_created',
      entityType: doc.type === 'proposal' ? 'proposal' : 'document',
      entityId: doc.id,
      performedBy: performedBy ?? rest.authorId ?? undefined,
      details: { title: doc.title, type: doc.type, dealId: doc.dealId },
    }).catch(() => {})

    return doc
  }

  /**
   * Update document metadata and optionally replace content in Storage.
   */
  async update(
    id: string,
    data: Partial<typeof documents.$inferInsert> & { content?: string },
    performedBy?: string,
  ) {
    const { content, ...rest } = data
    const updates: Partial<typeof documents.$inferInsert> = {
      ...rest,
      updatedAt: new Date(),
    }

    if (content !== undefined) {
      const doc = await this.findOne(id)
      if (!doc) throw new NotFoundException(`Document ${id} not found`)
      await this.storage.writeMarkdown(doc.storagePath, content)
      const extracted = StorageService.extractExcerpt(content)
      updates.excerpt = extracted.excerpt
      updates.wordCount = extracted.wordCount
    }

    const [doc] = await this.db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning()

    // Audit every document update (proposals get a distinct auditType)
    if (doc) {
      this.auditLogs.log({
        action: 'update',
        auditType: doc.type === 'proposal' ? 'proposal_updated' : 'document_updated',
        entityType: doc.type === 'proposal' ? 'proposal' : 'document',
        entityId: id,
        performedBy: performedBy ?? undefined,
        details: {
          title: doc.title,
          type: doc.type,
          fields: Object.keys(rest).filter(k => k !== 'updatedAt'),
        },
      }).catch(() => {})
    }

    return doc
  }

  /** Hard delete — removes storage file + DB row permanently */
  async remove(id: string) {
    const doc = await this.findOne(id)
    if (!doc) throw new NotFoundException(`Document ${id} not found`)

    // Delete from storage (best-effort — don't block DB cleanup)
    try {
      await this.storage.delete(CONTENT_BUCKET, doc.storagePath)
    } catch (e) {
      // Storage delete is best-effort — log and continue
    }

    // Hard delete from DB
    await this.db.delete(documents).where(eq(documents.id, id))

    // Audit
    this.auditLogs.log({
      action: 'delete',
      auditType: 'document_deleted',
      entityType: 'document',
      entityId: id,
      details: { title: doc.title, type: doc.type, dealId: doc.dealId },
    }).catch(() => {})
  }

  /** Generate a signed download URL for a document */
  async getDownloadUrl(id: string): Promise<{ url: string; filename: string }> {
    const doc = await this.findOne(id)
    if (!doc) throw new NotFoundException(`Document ${id} not found`)
    // Binary files (images, audio) live in ATTACHMENTS_BUCKET; text docs in CONTENT_BUCKET
    const IMAGE_TAGS = ['jpeg', 'jpg', 'png', 'webp', 'gif']
    const AUDIO_TAGS = ['mp3', 'm4a', 'mpeg', 'mp4', 'x-m4a']
    const isBinary =
      doc.tags?.some(t => IMAGE_TAGS.includes(t)) ||
      doc.tags?.some(t => AUDIO_TAGS.includes(t))
    const bucket = isBinary ? ATTACHMENTS_BUCKET : CONTENT_BUCKET
    const url = await this.storage.signedUrl(bucket, doc.storagePath, 3600)
    // Extract filename from storagePath (last segment)
    const filename = doc.storagePath.split('/').pop() ?? doc.title
    return { url, filename }
  }

  /**
   * Generate a signed preview URL for a document.
   * Images and audio are stored as binaries in ATTACHMENTS_BUCKET.
   * Text documents are in CONTENT_BUCKET.
   */
  async getPreviewUrl(id: string): Promise<{ url: string; mimeType: string }> {
    const doc = await this.findOne(id)
    if (!doc) throw new NotFoundException(`Document ${id} not found`)
    const IMAGE_TAGS = ['jpeg', 'jpg', 'png', 'webp', 'gif']
    const AUDIO_TAGS = ['mp3', 'm4a', 'mpeg', 'mp4', 'x-m4a']
    const isBinary =
      doc.tags?.some(t => IMAGE_TAGS.includes(t)) ||
      doc.tags?.some(t => AUDIO_TAGS.includes(t))
    const bucket = isBinary ? ATTACHMENTS_BUCKET : CONTENT_BUCKET
    const url = await this.storage.signedUrl(bucket, doc.storagePath, 3600)
    const ext = doc.tags?.find(t => [...IMAGE_TAGS, ...AUDIO_TAGS].includes(t)) ?? 'bin'
    const mimeType = `${doc.tags?.some(t => AUDIO_TAGS.includes(t)) ? 'audio' : 'image'}/${ext}`
    return { url, mimeType }
  }

  /**
   * Upsert the AI context document for a deal. Creates if absent, updates if present.
   * This is the main file the AI agent writes to — deals/{dealId}/context.md
   */
  async upsertDealContext(params: {
    dealId: string
    workspaceId: string
    authorId: string
    content: string
  }) {
    const storagePath = `deals/${params.dealId}/context.md`
    const existing = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.storagePath, storagePath), isNull(documents.deletedAt)))
      .limit(1)

    const { excerpt, wordCount } = StorageService.extractExcerpt(params.content)
    await this.storage.writeMarkdown(storagePath, params.content)

    if (existing.length > 0) {
      const [doc] = await this.db
        .update(documents)
        .set({ excerpt, wordCount, updatedAt: new Date(), isAiGenerated: true })
        .where(eq(documents.id, existing[0].id))
        .returning()
      return doc
    }

    const [doc] = await this.db
      .insert(documents)
      .values({
        workspaceId: params.workspaceId,
        dealId: params.dealId,
        authorId: params.authorId,
        type: 'context',
        title: 'Deal Context',
        storagePath,
        excerpt,
        wordCount,
        isAiGenerated: true,
        isPinned: true,
      })
      .returning()
    return doc
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private derivePath(data: Partial<typeof documents.$inferInsert>): string {
    const type = data.type ?? 'general'
    const ts = Date.now()
    if (data.dealId) return `deals/${data.dealId}/${type}/${type}-${ts}.md`
    if (data.companyId) return `companies/${data.companyId}/${type}/${type}-${ts}.md`
    if (data.contactId) return `contacts/${data.contactId}/${type}/${type}-${ts}.md`
    return `workspace/${data.workspaceId ?? 'default'}/${type}-${ts}.md`
  }
}
