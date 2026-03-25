import { Injectable, Inject } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { contacts } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

@Injectable()
export class ContactsService {
  constructor(@Inject(DB) private db: Database) {}

  async findAll() {
    return this.db.select().from(contacts).orderBy(desc(contacts.createdAt))
  }

  async findByCompany(companyId: string) {
    return this.db.select().from(contacts).where(eq(contacts.companyId, companyId))
  }

  async findOne(id: string) {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, id))
    return contact
  }

  async create(data: typeof contacts.$inferInsert) {
    const [contact] = await this.db.insert(contacts).values(data).returning()
    return contact
  }

  async update(id: string, data: Partial<typeof contacts.$inferInsert>) {
    const [contact] = await this.db.update(contacts).set(data).where(eq(contacts.id, id)).returning()
    return contact
  }

  async remove(id: string) {
    await this.db.delete(contacts).where(eq(contacts.id, id))
  }
}
