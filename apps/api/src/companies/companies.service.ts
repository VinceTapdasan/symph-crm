import { Injectable, Inject } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { companies } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

@Injectable()
export class CompaniesService {
  constructor(@Inject(DB) private db: Database) {}

  async findAll() {
    return this.db.select().from(companies).orderBy(desc(companies.createdAt))
  }

  async findOne(id: string) {
    const [company] = await this.db.select().from(companies).where(eq(companies.id, id))
    return company
  }

  async create(data: typeof companies.$inferInsert) {
    const [company] = await this.db.insert(companies).values(data).returning()
    return company
  }

  async update(id: string, data: Partial<typeof companies.$inferInsert>) {
    const [company] = await this.db.update(companies).set(data).where(eq(companies.id, id)).returning()
    return company
  }

  async remove(id: string) {
    await this.db.delete(companies).where(eq(companies.id, id))
  }
}
