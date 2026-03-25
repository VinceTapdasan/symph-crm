import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { deals } from './deals'
import { users } from './users'
import { workspaces } from './workspaces'

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  dealId: uuid('deal_id').references(() => deals.id),
  actorId: text('actor_id').references(() => users.id),
  type: text('type', {
    enum: [
      'deal_created', 'deal_stage_changed', 'deal_updated', 'deal_value_changed',
      'note_added', 'note_updated', 'file_uploaded', 'contact_added',
      'company_created', 'company_updated', 'customization_requested', 'customization_delivered',
      'pitch_created', 'am_assigned', 'deal_flagged', 'deal_unflagged',
      'deal_won', 'deal_lost', 'proposal_created', 'proposal_sent', 'attachment_added',
    ],
  }).notNull(),
  metadata: jsonb('metadata').default({}),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
