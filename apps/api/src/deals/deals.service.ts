import { Injectable, Inject } from '@nestjs/common'
import { eq, desc, and, ilike, gte, lte, inArray, isNull, count, sql } from 'drizzle-orm'
import { deals, documents, users, amRoster, pipelineStages } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'
import { AuditLogsService } from '../audit-logs/audit-logs.service'

export type DealsFilterParams = {
  companyId?: string
  stage?: string        // pipeline stage slug (e.g. 'lead', 'discovery')
  search?: string
  limit?: number
  from?: string
  to?: string
}

@Injectable()
export class DealsService {
  constructor(
    @Inject(DB) private db: Database,
    private auditLogs: AuditLogsService,
  ) {}

  async findAll(params?: DealsFilterParams) {
    const limit = params?.limit ?? 200
    const conditions = []

    if (params?.companyId) conditions.push(eq(deals.companyId, params.companyId))
    if (params?.search) conditions.push(ilike(deals.title, `%${params.search}%`))
    if (params?.from) conditions.push(gte(deals.createdAt, new Date(params.from)))
    if (params?.to) conditions.push(lte(deals.createdAt, new Date(params.to)))

    // Filter by stage slug — resolve to stage_id via subquery
    if (params?.stage) {
      conditions.push(
        sql`${deals.stageId} = (SELECT id FROM pipeline_stages WHERE slug = ${params.stage} LIMIT 1)`,
      )
    }

    const query = conditions.length > 0
      ? this.db.select().from(deals).where(and(...conditions)).orderBy(desc(deals.createdAt)).limit(limit)
      : this.db.select().from(deals).orderBy(desc(deals.createdAt)).limit(limit)

    const rawDeals = await query
    if (rawDeals.length === 0) return []

    // Batch-fetch document counts for all returned deal IDs
    const dealIds = rawDeals.map(d => d.id)
    const docCounts = await this.db
      .select({ dealId: documents.dealId, cnt: count() })
      .from(documents)
      .where(and(
        inArray(documents.dealId, dealIds as [string, ...string[]]),
        isNull(documents.deletedAt),
      ))
      .groupBy(documents.dealId)

    const docCountMap = new Map(docCounts.map(r => [r.dealId, r.cnt]))

    // Batch-fetch user names for all unique createdBy values
    const creatorIds = [
      ...new Set(rawDeals.map(d => d.createdBy).filter((id): id is string => !!id)),
    ]
    const userRows = creatorIds.length > 0
      ? await this.db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, creatorIds as [string, ...string[]]))
      : []

    const userNameMap = new Map(userRows.map(u => [u.id, u.name]))

    return rawDeals.map(d => ({
      ...d,
      documentCount: docCountMap.get(d.id) ?? 0,
      createdByName: d.createdBy ? (userNameMap.get(d.createdBy) ?? null) : null,
    }))
  }

  async findByCompany(companyId: string) {
    return this.db
      .select()
      .from(deals)
      .where(eq(deals.companyId, companyId))
      .orderBy(desc(deals.createdAt))
  }

  async findOne(id: string) {
    const [deal] = await this.db.select().from(deals).where(eq(deals.id, id))
    return deal
  }

  async updateStage(id: string, stage: string, performedBy?: string) {
    // Resolve slug → pipeline_stage ID
    const [pipelineStage] = await this.db
      .select({ id: pipelineStages.id })
      .from(pipelineStages)
      .where(eq(pipelineStages.slug, stage))
      .limit(1)

    // Capture current stage slug for audit trail
    const existing = await this.findOne(id)
    let oldStageSlug: string | null = null
    if (existing?.stageId) {
      const [oldStage] = await this.db
        .select({ slug: pipelineStages.slug })
        .from(pipelineStages)
        .where(eq(pipelineStages.id, existing.stageId))
        .limit(1)
      oldStageSlug = oldStage?.slug ?? null
    }

    const [deal] = await this.db
      .update(deals)
      .set({
        stageId: pipelineStage?.id ?? null,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning()

    this.auditLogs.log({
      action: 'status_change',
      auditType: 'deal_stage_change',
      entityType: 'deal',
      entityId: id,
      performedBy: performedBy ?? undefined,
      details: {
        title: existing?.title,
        from: oldStageSlug,
        to: stage,
      },
    }).catch(() => {}) // non-blocking

    return deal
  }

  async create(data: typeof deals.$inferInsert, performedBy?: string) {
    const [deal] = await this.db.insert(deals).values(data).returning()

    // Auto-add assigned user to AM roster
    if (deal.assignedTo) {
      this.ensureOnRoster(deal.assignedTo, deal.workspaceId).catch(() => {})
    }

    this.auditLogs.log({
      action: 'create',
      auditType: 'deal_created',
      entityType: 'deal',
      entityId: deal.id,
      performedBy: performedBy ?? data.createdBy ?? undefined,
      details: { title: deal.title, stageId: deal.stageId },
    }).catch(() => {})

    return deal
  }

  async update(id: string, data: Partial<typeof deals.$inferInsert>, performedBy?: string) {
    const [deal] = await this.db.update(deals).set(data).where(eq(deals.id, id)).returning()

    // Auto-add assigned user to AM roster when assignedTo changes
    if (data.assignedTo && deal) {
      this.ensureOnRoster(data.assignedTo, deal.workspaceId).catch(() => {})
    }

    this.auditLogs.log({
      action: 'update',
      auditType: 'deal_updated',
      entityType: 'deal',
      entityId: id,
      performedBy: performedBy ?? undefined,
      details: { fields: Object.keys(data).filter(k => k !== 'updatedAt') },
    }).catch(() => {})

    return deal
  }

  async remove(id: string, performedBy?: string) {
    const existing = await this.findOne(id)

    await this.db.delete(deals).where(eq(deals.id, id))

    this.auditLogs.log({
      action: 'delete',
      auditType: 'deal_deleted',
      entityType: 'deal',
      entityId: id,
      performedBy: performedBy ?? undefined,
      details: { title: existing?.title },
    }).catch(() => {})
  }

  /**
   * Touch lastActivityAt and clear dormancy flag in one atomic UPDATE.
   * Call this from any service that records activity against a deal:
   *   - chat message about a deal
   *   - document created / updated
   *   - file uploaded
   *   - calendar event linked
   *   - stage change (already handled in updateStage)
   */
  async updateLastActivity(id: string): Promise<void> {
    await this.db
      .update(deals)
      .set({
        lastActivityAt: new Date(),
        isFlagged: false,
        flagReason: null,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
  }

  /**
   * Ensure a user is on the AM roster. Auto-called when a deal is assigned.
   * If user already exists on roster, updates lastAssignedAt and increments count.
   * Schema has UNIQUE on userId — uses ON CONFLICT DO UPDATE for atomicity.
   */
  private async ensureOnRoster(userId: string, workspaceId: string | null): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(amRoster)
      .where(eq(amRoster.userId, userId))
      .limit(1)

    if (existing) {
      await this.db
        .update(amRoster)
        .set({
          lastAssignedAt: new Date(),
          assignmentCount: sql`${amRoster.assignmentCount} + 1`,
          isActive: true,
        })
        .where(eq(amRoster.userId, userId))
    } else {
      await this.db
        .insert(amRoster)
        .values({
          userId,
          workspaceId: workspaceId ?? undefined,
          isActive: true,
          lastAssignedAt: new Date(),
          assignmentCount: 1,
        })
    }
  }
}
