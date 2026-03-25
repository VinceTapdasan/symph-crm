import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { products, tiers } from './products'
import { users } from './users'

export const pitchDecks = pgTable('pitch_decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  tierId: uuid('tier_id').references(() => tiers.id),
  title: text('title').notNull(),
  content: jsonb('content').default({}),
  htmlUrl: text('html_url'),
  demoToken: text('demo_token').unique(),
  generatedBy: text('generated_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
