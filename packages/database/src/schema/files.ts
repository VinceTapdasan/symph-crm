import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { deals } from './deals'
import { users } from './users'

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  dealId: uuid('deal_id').references(() => deals.id),
  uploadedBy: text('uploaded_by').references(() => users.id).notNull(),
  filename: text('filename').notNull(),
  storagePath: text('storage_path').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // ── Transcription lifecycle ────────────────────────────────────────────────
  // Populated for audio files (voice notes, call recordings).
  // status: 'none' for non-audio files, 'pending' → 'success' | 'failed' for audio.
  // If 'failed', transcriptionError explains why — frontend can offer retry.
  transcriptionStatus: text('transcription_status').default('none').notNull(),
  transcriptionText:   text('transcription_text'),
  transcriptionError:  text('transcription_error'),
  retryCount:          integer('retry_count').default(0).notNull(),
})
