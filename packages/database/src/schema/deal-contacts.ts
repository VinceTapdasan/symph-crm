import { pgTable, uuid, text, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { deals } from './deals'
import { contacts } from './contacts'

/**
 * deal_contacts — many-to-many junction between deals and contacts.
 *
 * A contact can be involved in multiple deals (e.g. the same POC for two
 * separate projects under the same company). Each row represents one
 * contact's involvement in one deal, with a typed role.
 *
 * Roles:
 *  poc         — primary point of contact for this deal
 *  stakeholder — has interest/influence but not day-to-day contact
 *  champion    — internal advocate for the deal
 *  blocker     — potential blocker to watch
 *  technical   — technical evaluator
 *  executive   — executive sponsor
 */
export const dealContacts = pgTable(
  'deal_contacts',
  {
    dealId: uuid('deal_id')
      .references(() => deals.id, { onDelete: 'cascade' })
      .notNull(),
    contactId: uuid('contact_id')
      .references(() => contacts.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role', {
      enum: ['poc', 'stakeholder', 'champion', 'blocker', 'technical', 'executive'],
    })
      .default('stakeholder')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.dealId, table.contactId] }),
  }),
)
