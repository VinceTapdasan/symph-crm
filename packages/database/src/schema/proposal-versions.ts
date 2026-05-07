import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { proposals } from './proposals'
import { users } from './users'

/**
 * proposal_versions — one row per saved revision of a proposal.
 *
 * The HTML source lives inline in the `html` text column. Postgres TOAST
 * compresses + out-of-lines values >2KB so an 86KB HTML proposal stores
 * as ~20KB. Sequential reads of metadata (list endpoints) do NOT pull this
 * column — never `SELECT *` on list queries; pull `html` only when the
 * editor or share-link render actually needs it.
 *
 * `(proposal_id, version)` is unique — two clients racing to save v4 will
 * have one succeed and the other fail with a constraint violation, which
 * the service layer retries with version+1.
 *
 * pdf_storage_path is reserved for the deferred PDF feature (see
 * docs/PROPOSAL-PDF-STRATEGY.md). Stays NULL until first generation.
 */
export const proposalVersions = pgTable('proposal_versions', {
  id: uuid('id').defaultRandom().primaryKey(),

  proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').notNull(),

  // Inline HTML. Capped at 5MB at the API layer — embed images via Storage URLs, not base64.
  html: text('html').notNull(),

  // Author note for this revision: "what changed".
  changeNote: text('change_note'),

  // Lightweight derived metadata — populated by the service on write.
  excerpt: text('excerpt'),
  wordCount: integer('word_count').default(0),

  // Reserved for the deferred PDF feature.
  pdfStoragePath: text('pdf_storage_path'),

  authorId: text('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqProposalVersion: uniqueIndex('proposal_versions_proposal_id_version_key').on(t.proposalId, t.version),
}))
