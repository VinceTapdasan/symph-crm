import { Injectable, Inject, OnModuleInit, Logger, NotFoundException } from '@nestjs/common'
import { and, eq, desc, sql } from 'drizzle-orm'
import { internalProducts } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'
import type { CreateInternalProductDto } from './dto/create-internal-product.dto'
import type { UpdateInternalProductDto } from './dto/update-internal-product.dto'

export type ProductType = 'internal' | 'service' | 'reseller'

const SEED_SERVICES: { slug: string; name: string }[] = [
  { slug: 'agency', name: 'The Agency' },
  { slug: 'consulting', name: 'Consulting' },
  { slug: 'staff_augmenting', name: 'Staff Augmenting' },
]

const SEED_RESELLERS: { slug: string; name: string }[] = [
  { slug: 'reseller_josys', name: 'Josys' },
  { slug: 'reseller_gcp', name: 'Google SCC - GCP' },
  { slug: 'reseller_apigee', name: 'Google Apigee' },
  { slug: 'reseller_gws', name: 'GWS' },
]

@Injectable()
export class InternalProductsService implements OnModuleInit {
  private readonly logger = new Logger(InternalProductsService.name)

  constructor(@Inject(DB) private db: Database) {}

  async onModuleInit() {
    try {
      // Base table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS internal_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID REFERENCES workspaces(id),
          name TEXT NOT NULL,
          industry TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      // New catalog columns (idempotent)
      await this.db.execute(`
        ALTER TABLE internal_products
          ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'internal'
      `)
      await this.db.execute(`
        ALTER TABLE internal_products ADD COLUMN IF NOT EXISTS slug TEXT
      `)
      await this.db.execute(`
        ALTER TABLE internal_products ADD COLUMN IF NOT EXISTS landing_page_link TEXT
      `)
      await this.db.execute(`
        ALTER TABLE internal_products ADD COLUMN IF NOT EXISTS icon_url TEXT
      `)

      // Deals columns (existing — kept for any first boot)
      await this.db.execute(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS sub_account_manager_id TEXT REFERENCES users(id)`)
      await this.db.execute(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS builders TEXT[] DEFAULT '{}'`)
      await this.db.execute(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS internal_product_id UUID REFERENCES internal_products(id)`)

      // Seed service + reseller catalog rows from the legacy SERVICE_TYPES constant.
      // Idempotent: only inserts when (product_type, slug) is missing.
      for (const s of SEED_SERVICES) {
        await this.db.execute(sql`
          INSERT INTO internal_products (product_type, slug, name)
          SELECT 'service', ${s.slug}, ${s.name}
          WHERE NOT EXISTS (
            SELECT 1 FROM internal_products WHERE product_type = 'service' AND slug = ${s.slug}
          )
        `)
      }
      for (const r of SEED_RESELLERS) {
        await this.db.execute(sql`
          INSERT INTO internal_products (product_type, slug, name)
          SELECT 'reseller', ${r.slug}, ${r.name}
          WHERE NOT EXISTS (
            SELECT 1 FROM internal_products WHERE product_type = 'reseller' AND slug = ${r.slug}
          )
        `)
      }

      this.logger.log('Catalog tables ready (internal_products + service/reseller seeds)')
    } catch (err) {
      this.logger.warn('Catalog migration skipped or failed:', err)
    }
  }

  async findAll(opts: { activeOnly?: boolean; type?: ProductType } = {}) {
    const conds = [] as ReturnType<typeof eq>[]
    if (opts.activeOnly) conds.push(eq(internalProducts.isActive, true))
    if (opts.type) conds.push(eq(internalProducts.productType, opts.type))
    const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds)
    const q = where
      ? this.db.select().from(internalProducts).where(where).orderBy(desc(internalProducts.createdAt))
      : this.db.select().from(internalProducts).orderBy(desc(internalProducts.createdAt))
    return q
  }

  async findOne(id: string) {
    const [row] = await this.db.select().from(internalProducts).where(eq(internalProducts.id, id))
    if (!row) throw new NotFoundException(`Catalog item ${id} not found`)
    return row
  }

  async create(dto: CreateInternalProductDto) {
    const [row] = await this.db
      .insert(internalProducts)
      .values({
        productType: dto.productType ?? 'internal',
        slug: dto.slug ?? null,
        name: dto.name,
        industry: dto.industry ?? null,
        landingPageLink: dto.landingPageLink ?? null,
        iconUrl: dto.iconUrl ?? null,
        isActive: dto.isActive ?? true,
      })
      .returning()
    return row
  }

  async update(id: string, dto: UpdateInternalProductDto) {
    const [existing] = await this.db.select().from(internalProducts).where(eq(internalProducts.id, id))
    if (!existing) throw new NotFoundException(`Catalog item ${id} not found`)

    const [row] = await this.db
      .update(internalProducts)
      .set({
        ...(dto.productType !== undefined ? { productType: dto.productType } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
        ...(dto.landingPageLink !== undefined ? { landingPageLink: dto.landingPageLink } : {}),
        ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(internalProducts.id, id))
      .returning()
    return row
  }

  async remove(id: string) {
    const [row] = await this.db.delete(internalProducts).where(eq(internalProducts.id, id)).returning()
    if (!row) throw new NotFoundException(`Catalog item ${id} not found`)
    return row
  }
}
