import { Injectable, Inject } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { activities } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DB) private db: Database) {}

  async findByDeal(dealId: string) {
    return this.db.select().from(activities).where(eq(activities.dealId, dealId)).orderBy(desc(activities.createdAt))
  }

  async findByCompany(companyId: string) {
    return this.db.select().from(activities).where(eq(activities.companyId, companyId)).orderBy(desc(activities.createdAt))
  }

  async create(data: typeof activities.$inferInsert) {
    const [activity] = await this.db.insert(activities).values(data).returning()
    return activity
  }
}
