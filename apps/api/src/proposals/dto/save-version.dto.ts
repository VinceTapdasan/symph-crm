/**
 * Body for POST /api/proposals/:id/versions — saves a new revision.
 * Increments version number, links to previous via parentId.
 */
export class SaveVersionDto {
  html: string
  changeNote?: string
}
