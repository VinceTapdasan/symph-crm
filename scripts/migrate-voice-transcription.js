#!/usr/bin/env node
/**
 * Migration: add transcription lifecycle columns to `files` table.
 *
 * Run once after deploying the voice persistence feature:
 *   DATABASE_URL=<url> node scripts/migrate-voice-transcription.js
 *
 * Safe to re-run — uses ADD COLUMN IF NOT EXISTS.
 */

const postgres = require('postgres')

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

async function run() {
  console.log('Running migration: add transcription columns to files table...')

  await sql`
    ALTER TABLE files
      ADD COLUMN IF NOT EXISTS transcription_status text    NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS transcription_text   text,
      ADD COLUMN IF NOT EXISTS transcription_error  text,
      ADD COLUMN IF NOT EXISTS retry_count          integer NOT NULL DEFAULT 0
  `

  console.log('Done.')
  await sql.end()
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
