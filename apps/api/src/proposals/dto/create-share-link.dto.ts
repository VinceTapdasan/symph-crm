/**
 * Body for POST /api/proposals/:id/share — issue a public share link.
 * If versionId is omitted, the link pins to the current head version at
 * creation time. Once created, the link does NOT auto-follow new versions.
 */
export class CreateShareLinkDto {
  versionId?: string
  expiresAt?: string  // ISO string; null/absent = never expires
}
