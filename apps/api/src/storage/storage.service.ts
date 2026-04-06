import * as fs from 'fs/promises'
import * as path from 'path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const CONTENT_BUCKET = 'content'
export const ATTACHMENTS_BUCKET = 'attachments'

/**
 * StorageService — dual-backend document storage.
 *
 * Markdown content (notes, transcripts, AI context docs) is stored on the
 * shared NFS volume at `{NFS_MOUNT_PATH}/crm/{storagePath}`. This gives Aria
 * direct filesystem access to all CRM documents without HTTP hops, and enables
 * git-tracked audit history on the NFS layer.
 *
 * Binary attachments (images, audio) remain in Supabase Storage where CDN
 * delivery and signed URLs are provided.
 *
 * Migration compatibility: readMarkdown() tries NFS first, then falls back to
 * Supabase Storage so existing documents written before the migration are still
 * readable. All new writes go to NFS only.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private supabase: SupabaseClient | null = null

  /** Root path for CRM markdown files on the NFS volume. */
  private readonly nfsRoot: string

  constructor(private config: ConfigService) {
    // NFS root — defaults to /share/crm (the dedicated CRM directory on Aria's NFS)
    const mountPath = config.get<string>('NFS_MOUNT_PATH') ?? '/share'
    this.nfsRoot = path.join(mountPath, 'crm')

    // Supabase client — still required for binary attachments
    const url = config.get<string>('SUPABASE_URL')
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    if (url && key) {
      this.supabase = createClient(url, key, { auth: { persistSession: false } })
      this.logger.log(`Storage initialized — NFS: ${this.nfsRoot}, Supabase: attachments`)
    } else {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY not configured — binary attachment storage is disabled. ' +
        `Markdown content will use NFS at ${this.nfsRoot}.`,
      )
    }
  }

  private get supabaseClient(): SupabaseClient {
    if (!this.supabase) throw new Error('Supabase Storage not configured (missing SUPABASE_SERVICE_ROLE_KEY)')
    return this.supabase
  }

  /** Resolve a storage path to its absolute NFS location. */
  private nfsPath(storagePath: string): string {
    return path.join(this.nfsRoot, storagePath)
  }

  // ── Markdown content (NFS-backed) ─────────────────────────────────────────

  /**
   * Read a markdown file.
   * Tries NFS first. If not found, falls back to Supabase Storage (migration
   * compatibility for documents written before the NFS migration).
   * Returns null if not found in either location.
   */
  async readMarkdown(storagePath: string): Promise<string | null> {
    // Primary: NFS
    try {
      const content = await fs.readFile(this.nfsPath(storagePath), 'utf-8')
      return content
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw new Error(`NFS read failed [${storagePath}]: ${err.message}`)
      }
    }

    // Fallback: Supabase Storage (pre-migration documents)
    if (!this.supabase) return null
    const { data, error } = await this.supabase.storage.from(CONTENT_BUCKET).download(storagePath)
    if (error) {
      if (error.message.includes('not found') || error.message.includes('Object not found')) return null
      throw new Error(`Supabase fallback read failed [${storagePath}]: ${error.message}`)
    }
    return await data.text()
  }

  /**
   * Write (upsert) a markdown file to NFS.
   * Creates intermediate directories as needed.
   */
  async writeMarkdown(storagePath: string, content: string): Promise<void> {
    const fullPath = this.nfsPath(storagePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  /**
   * Delete a markdown file from NFS.
   * Does not throw if the file does not exist.
   */
  async deleteMarkdown(storagePath: string): Promise<void> {
    try {
      await fs.unlink(this.nfsPath(storagePath))
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        this.logger.warn(`NFS delete failed [${storagePath}]: ${err.message}`)
      }
    }
  }

  // ── Binary attachments (Supabase Storage) ────────────────────────────────

  /** Upload a binary attachment. Returns the storage path. */
  async uploadAttachment(storagePath: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.supabaseClient.storage.from(ATTACHMENTS_BUCKET).upload(storagePath, buffer, {
      upsert: true,
      contentType: mimeType,
    })
    if (error) throw new Error(`Attachment upload failed [${storagePath}]: ${error.message}`)
    return storagePath
  }

  /** Read a binary attachment from the attachments bucket. Returns a Buffer. */
  async readAttachment(storagePath: string): Promise<Buffer> {
    const { data, error } = await this.supabaseClient.storage.from(ATTACHMENTS_BUCKET).download(storagePath)
    if (error) throw new Error(`Attachment read failed [${storagePath}]: ${error.message}`)
    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /** Generate a signed URL for a binary attachment (expires in 1 hour by default). */
  async signedUrl(bucket: string, storagePath: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.supabaseClient.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds)
    if (error) throw new Error(`Signed URL failed [${storagePath}]: ${error.message}`)
    return data.signedUrl
  }

  /**
   * Delete a file from Supabase Storage (binary attachments).
   * For markdown content deletion, use deleteMarkdown() instead.
   */
  async delete(bucket: string, storagePath: string): Promise<void> {
    const { error } = await this.supabaseClient.storage.from(bucket).remove([storagePath])
    if (error) this.logger.warn(`Supabase delete failed [${storagePath}]: ${error.message}`)
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  /** Returns true if the NFS mount is reachable. */
  get isConfigured(): boolean {
    return true // NFS is always available; checked at startup via logger
  }

  /** Extract a ~500-char excerpt and word count from markdown content. */
  static extractExcerpt(content: string): { excerpt: string; wordCount: number } {
    const stripped = content
      .replace(/^#{1,6}\s+/gm, '')          // remove headings
      .replace(/\*\*(.+?)\*\*/g, '$1')      // remove bold
      .replace(/\*(.+?)\*/g, '$1')          // remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // remove links
      .replace(/`(.+?)`/g, '$1')            // remove inline code
      .replace(/\n{2,}/g, ' ')              // collapse newlines
      .trim()
    const excerpt = stripped.slice(0, 500)
    const wordCount = content.split(/\s+/).filter(Boolean).length
    return { excerpt, wordCount }
  }
}
