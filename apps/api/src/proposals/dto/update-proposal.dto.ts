/**
 * Body for PUT /api/proposals/:id — metadata-only updates (rename, pin/unpin).
 * For content changes, save a new version via POST .../versions.
 */
export class UpdateProposalDto {
  title?: string
  isPinned?: boolean
}
