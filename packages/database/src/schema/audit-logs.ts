import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  action: text('action', { enum: ['create', 'update', 'delete', 'status_change'] }).notNull(),
  auditType: text('audit_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  source: text('source'),
  performedBy: text('performed_by').references(() => users.id),
  orgId: text('org_id'),
  details: jsonb('details'),
})
