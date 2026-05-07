import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { proposalVersions } from './proposal-versions'
import { users } from './users'

/**
 * proposal_share_links — public read-only access tokens for a proposal version.
 *
 * Each link is pinned to a *specific* version (FK to proposal_versions, not
 * proposals). Saving a new version does NOT auto-update existing links —
 * a link issued for v3 keeps rendering v3 even after v4 lands. To share
 * the latest, AMs issue a fresh link.
 *
 * The public route /api/public/proposals/:token validates the token,
 * loads the linked version's HTML, strips <script> tags, and serves it.
 * View metrics (count, last_viewed_at) bump on every successful render.
 */
export const proposalShareLinks = pgTable('proposal_share_links', {
  id: uuid('id').defaultRandom().primaryKey(),

  proposalVersionId: uuid('proposal_version_id').references(() => proposalVersions.id, { onDelete: 'cascade' }).notNull(),

  // URL-safe random opaque token. Unique across the table.
  token: text('token').notNull().unique(),

  // Optional expiry. NULL = never expires.
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  viewCount: integer('view_count').default(0).notNull(),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),

  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Soft-revoke. Hides the link from the API without dropping view stats.
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
})
