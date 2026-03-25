import { Injectable, Inject } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { notes } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

@Injectable()
export class NotesService {
  constructor(@Inject(DB) private db: Database) {}

  async findByDeal(dealId: string) {
    return this.db.select().from(notes).where(eq(notes.dealId, dealId)).orderBy(desc(notes.createdAt))
  }

  async findByCompany(companyId: string) {
    return this.db.select().from(notes).where(eq(notes.companyId, companyId)).orderBy(desc(notes.createdAt))
  }

  async create(data: typeof notes.$inferInsert) {
    const [note] = await this.db.insert(notes).values(data).returning()
    return note
  }

  async update(id: string, data: Partial<typeof notes.$inferInsert>) {
    const [note] = await this.db.update(notes).set(data).where(eq(notes.id, id)).returning()
    return note
  }

  async remove(id: string) {
    await this.db.delete(notes).where(eq(notes.id, id))
  }
}
