import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { companies } from './companies'

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  title: text('title'),
  linkedinUrl: text('linkedin_url'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  // Notes live in Supabase Storage — path stored in documents table, not inline here
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
