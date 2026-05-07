/**
 * Body for POST /api/deals/:dealId/proposals — creates a new proposal (v1).
 * The dealId comes from the URL path and is not part of the body.
 */
export class CreateProposalDto {
  title: string
  html: string
  changeNote?: string  // defaults to "Initial draft" if absent
}
