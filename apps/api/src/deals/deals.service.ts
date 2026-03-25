import { Injectable, Inject } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { deals } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

@Injectable()
export class DealsService {
  constructor(@Inject(DB) private db: Database) {}

  async findAll() {
    return this.db.select().from(deals).orderBy(desc(deals.createdAt))
  }

  async findOne(id: string) {
    const [deal] = await this.db.select().from(deals).where(eq(deals.id, id))
    return deal
  }

  async create(data: typeof deals.$inferInsert) {
    const [deal] = await this.db.insert(deals).values(data).returning()
    return deal
  }

  async update(id: string, data: Partial<typeof deals.$inferInsert>) {
    const [deal] = await this.db.update(deals).set(data).where(eq(deals.id, id)).returning()
    return deal
  }

  async remove(id: string) {
    await this.db.delete(deals).where(eq(deals.id, id))
  }
}
