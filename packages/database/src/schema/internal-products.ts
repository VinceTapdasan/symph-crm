import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'

/**
 * Catalog table — holds three kinds of catalog items:
 *   - 'internal'  → in-house Symph products (HireAI, etc.)
 *   - 'service'   → service offerings (Agency, Consulting, Staff Augmenting)
 *   - 'reseller'  → reseller partnerships (Josys, GCP, Apigee, GWS)
 *
 * `slug` matches the legacy values stored in `deals.services_tags` (text[])
 * so existing deals keep working — e.g. 'agency', 'reseller_josys'.
 *
 * Table name kept as `internal_products` to avoid an upstream-conflicting rename.
 */
export const internalProducts = pgTable('internal_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  productType: text('product_type', { enum: ['internal', 'service', 'reseller'] })
    .default('internal')
    .notNull(),
  slug: text('slug'),
  name: text('name').notNull(),
  industry: text('industry'),
  landingPageLink: text('landing_page_link'),
  iconUrl: text('icon_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
