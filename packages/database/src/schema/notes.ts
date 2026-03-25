import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { companies } from './companies'
import { deals } from './deals'
import { contacts } from './contacts'
import { workspaces } from './workspaces'

export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title'),
  content: text('content').default('').notNull(),
  templateType: text('template_type'),
  authorId: text('author_id').references(() => users.id).notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  dealId: uuid('deal_id').references(() => deals.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  isPinned: boolean('is_pinned').default(false).notNull(),
  tags: text('tags').array(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const noteAttachments = pgTable('note_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').references(() => notes.id).notNull(),
  filename: text('filename').notNull(),
  storagePath: text('storage_path').notNull(),
  fileUrl: text('file_url'),
  fileSize: text('file_size'),
  mimeType: text('mime_type'),
  uploadedBy: text('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
