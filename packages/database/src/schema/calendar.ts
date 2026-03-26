import { pgTable, uuid, text, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'
import { users } from './users'
import { deals } from './deals'

/**
 * user_calendar_connections — stores OAuth tokens per user.
 *
 * refresh_token is stored AES-256-GCM encrypted at the application layer
 * (CalendarConnectionsService encrypts before insert, decrypts before use).
 * The encryption key lives in Secret Manager, never in code or env files.
 */
export const userCalendarConnections = pgTable('user_calendar_connections', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       text('user_id').references(() => users.id).notNull().unique(),
  googleEmail:  text('google_email').notNull(),
  refreshToken: text('refresh_token').notNull(), // AES-256-GCM encrypted
  syncToken:    text('sync_token'),              // incremental sync cursor
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  isActive:     boolean('is_active').default(true).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * calendar_events — local mirror of Google Calendar events.
 *
 * Source of truth is always Google. This table is kept in sync by:
 *   - Initial full sync on OAuth connect (30-day window)
 *   - Incremental sync via Cloud Scheduler every 5 min using syncToken
 *   - Immediate write when AM creates/updates/deletes via CRM
 *
 * google_event_id + user_id is unique (one row per event per user).
 */
export const calendarEvents = pgTable('calendar_events', {
  id:             uuid('id').defaultRandom().primaryKey(),
  workspaceId:    uuid('workspace_id').references(() => workspaces.id),
  googleEventId:  text('google_event_id').notNull(),
  userId:         text('user_id').references(() => users.id).notNull(),
  title:          text('title').notNull(),
  description:    text('description'),
  startAt:        timestamp('start_at', { withTimezone: true }).notNull(),
  endAt:          timestamp('end_at', { withTimezone: true }).notNull(),
  location:       text('location'),
  attendeeEmails: text('attendee_emails').array().default([]),
  dealId:         uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
  eventType:      text('event_type', {
    enum: ['demo', 'discovery_call', 'followup', 'general'],
  }).default('general').notNull(),
  rawJson:        jsonb('raw_json'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqEventUser: unique().on(t.googleEventId, t.userId),
}))
