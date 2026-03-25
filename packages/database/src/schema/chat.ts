import { pgTable, uuid, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'
import { users } from './users'

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title'),
  contextType: text('context_type', { enum: ['deal', 'company', 'contact', 'pipeline', 'global'] }),
  contextId: uuid('context_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  actionsTaken: jsonb('actions_taken').default([]),
  attachments: jsonb('attachments').default([]),
  isVoice: boolean('is_voice').default(false),
  voiceUrl: text('voice_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
