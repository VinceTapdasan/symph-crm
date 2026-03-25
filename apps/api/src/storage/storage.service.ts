import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const CONTENT_BUCKET = 'content'
export const ATTACHMENTS_BUCKET = 'attachments'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private supabase: SupabaseClient

  constructor(private config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL')
    const key = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')
    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    })
  }

  /** Read a markdown file from the content bucket. Returns null if not found. */
  async readMarkdown(path: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage.from(CONTENT_BUCKET).download(path)
    if (error) {
      if (error.message.includes('not found') || error.message.includes('Object not found')) return null
      throw new Error(`Storage read failed [${path}]: ${error.message}`)
    }
    return await data.text()
  }

  /** Write (upsert) a markdown file to the content bucket. */
  async writeMarkdown(path: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/markdown' })
    const { error } = await this.supabase.storage.from(CONTENT_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: 'text/markdown',
    })
    if (error) throw new Error(`Storage write failed [${path}]: ${error.message}`)
  }

  /** Upload a binary attachment. Returns the storage path. */
  async uploadAttachment(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: mimeType,
    })
    if (error) throw new Error(`Attachment upload failed [${path}]: ${error.message}`)
    return path
  }

  /** Generate a signed URL for reading a file (expires in 1 hour by default). */
  async signedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds)
    if (error) throw new Error(`Signed URL failed [${path}]: ${error.message}`)
    return data.signedUrl
  }

  /** Delete a file. Does not throw if the file doesn't exist. */
  async delete(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path])
    if (error) this.logger.warn(`Storage delete failed [${path}]: ${error.message}`)
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
