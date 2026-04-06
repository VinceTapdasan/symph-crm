/**
 * One-time migration: Supabase Storage content bucket → NFS vault
 *
 * For each non-deleted document in the DB:
 *   1. Check if file already exists on NFS (skip if yes — idempotent)
 *   2. Download from Supabase Storage content bucket
 *   3. Write to /share/crm/{storagePath}
 *   4. Verify NFS file matches downloaded content
 *
 * Run with:
 *   DB_URL=... SUPABASE_URL=... SUPABASE_KEY=... node scripts/migrate-to-nfs.mjs
 *   Or: node scripts/migrate-to-nfs.mjs --dry-run  (just count, no writes)
 */

import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import fs from 'fs/promises'
import path from 'path'

const { Client } = pg

const DRY_RUN = process.argv.includes('--dry-run')
const NFS_ROOT = path.join(process.env.NFS_MOUNT_PATH ?? '/share', 'crm')
const CONTENT_BUCKET = 'content'

const DB_URL = process.env.DB_URL
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

if (!DB_URL || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars: DB_URL, SUPABASE_URL, SUPABASE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const db = new Client({ connectionString: DB_URL })

async function main() {
  await db.connect()
  console.log(`NFS root: ${NFS_ROOT}`)
  console.log(`Dry run: ${DRY_RUN}\n`)

  // Fetch all non-deleted documents
  const { rows: docs } = await db.query(`
    SELECT id, storage_path, type, title, deal_id, company_id
    FROM documents
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
  `)

  console.log(`Total documents to migrate: ${docs.length}\n`)

  const stats = { skipped: 0, migrated: 0, failed: 0, alreadyOnNfs: 0 }

  for (const doc of docs) {
    const nfsPath = path.join(NFS_ROOT, doc.storage_path)

    // Skip if already on NFS
    try {
      await fs.access(nfsPath)
      stats.alreadyOnNfs++
      process.stdout.write('.')
      continue
    } catch {
      // Not on NFS yet — proceed
    }

    // Download from Supabase Storage
    const { data, error } = await supabase.storage.from(CONTENT_BUCKET).download(doc.storage_path)
    if (error) {
      if (error.message.includes('not found') || error.message.includes('Object not found')) {
        // Document in DB but no file in Storage — skip
        stats.skipped++
        process.stdout.write('s')
        continue
      }
      console.error(`\nFailed to download [${doc.storage_path}]: ${error.message}`)
      stats.failed++
      continue
    }

    const content = await data.text()

    if (DRY_RUN) {
      stats.migrated++
      process.stdout.write('+')
      continue
    }

    // Write to NFS
    try {
      await fs.mkdir(path.dirname(nfsPath), { recursive: true })
      await fs.writeFile(nfsPath, content, 'utf-8')

      // Verify
      const written = await fs.readFile(nfsPath, 'utf-8')
      if (written !== content) throw new Error('Content mismatch after write')

      stats.migrated++
      process.stdout.write('+')
    } catch (err) {
      console.error(`\nNFS write failed [${doc.storage_path}]: ${err.message}`)
      stats.failed++
    }
  }

  await db.end()

  console.log('\n\n── Migration complete ──────────────────')
  console.log(`  Already on NFS (skipped): ${stats.alreadyOnNfs}`)
  console.log(`  Migrated:                 ${stats.migrated}`)
  console.log(`  Skipped (no file in S3):  ${stats.skipped}`)
  console.log(`  Failed:                   ${stats.failed}`)
  console.log(`  Total processed:          ${docs.length}`)

  if (stats.failed > 0) {
    console.error(`\n${stats.failed} failures — check logs above.`)
    process.exit(1)
  }

  if (!DRY_RUN) {
    console.log('\nAll documents are now on NFS. Supabase Storage content bucket')
    console.log('can be cleaned up once you verify the CRM is reading from NFS correctly.')
  }
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
