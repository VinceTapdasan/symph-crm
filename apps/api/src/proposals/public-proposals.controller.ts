import { Controller, Get, Param, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ProposalsService } from './proposals.service'

/**
 * Public read-only access to shared proposals. NO auth — token is the
 * capability. Token validation, expiry, and revocation handled in the
 * service. Scripts are stripped from the returned HTML.
 *
 * Mounted under /public/* — RolesGuard skips this prefix
 * (see RolesGuard.canActivate in apps/api/src/auth/roles.guard.ts).
 *
 * Two response shapes:
 *   GET /api/public/proposals/:token        →  full HTML page (text/html)
 *   GET /api/public/proposals/:token/json   →  JSON {title, version, html}
 */
@Controller('public/proposals')
export class PublicProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Get(':token')
  async render(@Param('token') token: string, @Res() res: Response) {
    const result = await this.proposals.resolvePublicToken(token)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Don't allow framing this on arbitrary sites — but our own app may need
    // to iframe it. Set SAMEORIGIN, override to ALLOW-FROM later if needed.
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Cache-Control', 'no-store')
    res.send(result.html)
  }

  @Get(':token/json')
  async renderJson(@Param('token') token: string) {
    return this.proposals.resolvePublicToken(token)
  }
}
