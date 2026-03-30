import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { GmailService } from './gmail.service'

/**
 * GmailController — Gmail inbox endpoints.
 *
 * GET /api/gmail/inbox  — fetch this month's filtered threads for the current user
 */
@Controller()
export class GmailController {
  constructor(private gmail: GmailService) {}

  /**
   * GET /api/gmail/inbox
   *
   * Returns threads for the requesting user where:
   *   - sender is one of INBOX_SENDERS
   *   - sent this calendar month
   *   - CC field is non-empty
   *
   * On success: { threads, fetchedAt }
   * Not connected: { threads: [], needsReconnect: true, error }
   * API error: { threads: [], error }
   */
  @Get('gmail/inbox')
  async inbox(@Req() req: Request) {
    const userId = req.headers['x-user-id'] as string
    return this.gmail.getInbox(userId)
  }
}
