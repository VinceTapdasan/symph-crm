import { Injectable, Logger } from '@nestjs/common'
import { google } from 'googleapis'
import { CalendarConnectionsService } from '../calendar/calendar-connections.service'

/**
 * GmailService — fetches inbox threads via Gmail API.
 *
 * Filter rules:
 *   1. From one of INBOX_SENDERS (the 8 Symph team addresses)
 *   2. Sent after the 1st of the current calendar month
 *   3. CC must be non-empty — emails with no CC are excluded always
 *
 * Auth: reuses the OAuth2 token stored during Google Calendar connection.
 * Requires gmail.readonly scope (added to OAuth flow 2026-03-30).
 * Users connected before this date must reconnect to grant the new scope.
 */

export const INBOX_SENDERS = [
  'mary.amora@symph.co',
  'gee@symph.co',
  'gee.quidet@symph.co',
  'chelle@symph.co',
  'chelle.gray@symph.co',
  'lyra.gemparo@symph.co',
  'kate.labra@symph.co',
  'vince.tapdasan@symph.co',
]

export type GmailMessage = {
  id: string
  subject: string
  from: string
  fromEmail: string
  to: string
  cc: string[]
  date: string
  snippet: string
  unread: boolean
  bodyHtml?: string
  bodyText?: string
}

export type GmailThread = {
  id: string
  subject: string
  from: string
  fromEmail: string
  latestDate: string
  snippet: string
  unread: boolean
  messageCount: number
  cc: string[]
  messages: GmailMessage[]
}

export type InboxResponse = {
  threads: GmailThread[]
  fetchedAt: string
  needsReconnect?: boolean
  error?: string
}

function parseEmailAddress(raw: string): { display: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      display: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim().toLowerCase(),
    }
  }
  return { display: raw.trim(), email: raw.trim().toLowerCase() }
}

function parseEmailList(raw: string): string[] {
  if (!raw?.trim()) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function getHeader(
  headers: { name?: string | null; value?: string | null }[],
  name: string,
): string {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function extractBody(payload: any): { html?: string; text?: string } {
  if (!payload) return {}

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return { html: Buffer.from(payload.body.data, 'base64url').toString('utf-8') }
  }

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return { text: Buffer.from(payload.body.data, 'base64url').toString('utf-8') }
  }

  if (payload.parts?.length) {
    let html: string | undefined
    let text: string | undefined
    for (const part of payload.parts) {
      const result = extractBody(part)
      if (result.html) html = result.html
      if (result.text && !text) text = result.text
    }
    return { html, text }
  }

  return {}
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name)

  constructor(private connections: CalendarConnectionsService) {}

  async getInbox(userId: string): Promise<InboxResponse> {
    const oauth2 = await this.connections.getAuthedOAuth2Client(userId)

    if (!oauth2) {
      return {
        threads: [],
        fetchedAt: new Date().toISOString(),
        needsReconnect: true,
        error: 'Google account not connected. Connect via Calendar settings.',
      }
    }

    const now = new Date()
    const afterDate = `${now.getFullYear()}/${now.getMonth() + 1}/1`
    const fromQuery = INBOX_SENDERS.map(e => `from:${e}`).join(' OR ')
    const query = `(${fromQuery}) after:${afterDate}`

    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2 })

      const listRes = await gmail.users.threads.list({
        userId: 'me',
        q: query,
        maxResults: 100,
      })

      const threadItems = listRes.data.threads ?? []
      if (threadItems.length === 0) {
        return { threads: [], fetchedAt: new Date().toISOString() }
      }

      const threads: GmailThread[] = []

      await Promise.allSettled(
        threadItems.map(async (item) => {
          try {
            const threadRes = await gmail.users.threads.get({
              userId: 'me',
              id: item.id!,
              format: 'full',
            })

            const rawMessages = threadRes.data.messages ?? []
            if (rawMessages.length === 0) return

            const messages: GmailMessage[] = []

            for (const msg of rawMessages) {
              const headers: { name?: string | null; value?: string | null }[] = msg.payload?.headers ?? []
              const ccRaw = getHeader(headers, 'Cc')
              const ccList = parseEmailList(ccRaw)

              // Exclude message if no CC
              if (ccList.length === 0) continue

              const fromRaw = getHeader(headers, 'From')
              const fromParsed = parseEmailAddress(fromRaw)
              const subject = getHeader(headers, 'Subject') || '(no subject)'
              const toRaw = getHeader(headers, 'To')
              const dateRaw = getHeader(headers, 'Date')
              const isUnread = (msg.labelIds ?? []).includes('UNREAD')
              const { html, text } = extractBody(msg.payload)

              messages.push({
                id: msg.id!,
                subject,
                from: fromParsed.display,
                fromEmail: fromParsed.email,
                to: toRaw,
                cc: ccList,
                date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
                snippet: msg.snippet ?? '',
                unread: isUnread,
                bodyHtml: html,
                bodyText: text,
              })
            }

            // Skip thread if no message passed the CC filter
            if (messages.length === 0) return

            const first = messages[0]
            const last = messages[messages.length - 1]

            threads.push({
              id: item.id!,
              subject: first.subject,
              from: first.from,
              fromEmail: first.fromEmail,
              latestDate: last.date,
              snippet: last.snippet,
              unread: messages.some(m => m.unread),
              messageCount: messages.length,
              cc: [...new Set(messages.flatMap(m => m.cc))],
              messages,
            })
          } catch (err) {
            this.logger.warn(`Failed to fetch thread ${item.id}: ${(err as Error).message}`)
          }
        }),
      )

      threads.sort(
        (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime(),
      )

      return { threads, fetchedAt: new Date().toISOString() }
    } catch (err: any) {
      const message = err?.message ?? String(err)
      const isInsufficientScope =
        message.includes('insufficient_scope') ||
        message.includes('Request had insufficient authentication scopes') ||
        err?.code === 403

      if (isInsufficientScope) {
        this.logger.warn(`User ${userId} needs to reconnect Google (insufficient gmail scope)`)
        return {
          threads: [],
          fetchedAt: new Date().toISOString(),
          needsReconnect: true,
          error: 'Gmail access not granted. Please reconnect your Google account to enable inbox.',
        }
      }

      this.logger.error(`Gmail inbox fetch failed for ${userId}: ${message}`)
      return {
        threads: [],
        fetchedAt: new Date().toISOString(),
        error: `Failed to load inbox: ${message}`,
      }
    }
  }
}
