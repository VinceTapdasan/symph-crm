import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'
import { users } from './users'

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  slug: text('slug').notNull(),
  label: text('label').notNull(),
  color: text('color').default('#6366f1').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const amRoster = pgTable('am_roster', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: text('user_id').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastAssignedAt: timestamp('last_assigned_at', { withTimezone: true }),
  assignmentCount: integer('assignment_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
