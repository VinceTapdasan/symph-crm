# Wiki Sync — Background Note Processing

When a user saves a note from the CRM UI, Aria syncs the deal's wiki pages in the
background. No user action needed. The note writes fast (NFS only), wiki update
happens asynchronously.

## Flow

```
User adds note in UI
  → POST /api/deals/{dealId}/notes
  → Write note file to NFS (/share/crm/deals/{dealId}/{category}/{filename}.md)
  → Return note to frontend immediately
  → Debounced 3s timer starts for this dealId

After 3s of quiet:
  → Fire [CRM_WIKI_SYNC] deal_id={uuid} note_path={...} to Aria gateway
  → Aria reads all notes from NFS for this deal
  → Updates deal index.md, company index.md, MASTER_INDEX.md
  → Also fires [CRM_SUMMARY] to regenerate the deal summary
```

## Trigger format

```
[CRM_WIKI_SYNC] deal_id={uuid} performed_by={userId|aria}
```

Handled by the `crm-ingest` skill in wiki-only mode — skips raw text parsing
(note is already structured) and goes straight to the wiki update phase.

## Debounce: spam protection

**Problem**: User adds 5 notes quickly. Without debouncing, 5 parallel wiki syncs
race on the same wiki files, last writer wins with potentially incomplete data.

**Solution**: In-memory debounce per `dealId` in `DealNotesService`.

```typescript
private readonly pendingWikiSyncs = new Map<string, NodeJS.Timeout>()

// On note save:
const existing = this.pendingWikiSyncs.get(dealId)
if (existing) clearTimeout(existing)
const timer = setTimeout(() => {
  this.pendingWikiSyncs.delete(dealId)
  this.fireWikiSync(dealId, authorId)
}, 3_000)
this.pendingWikiSyncs.set(dealId, timer)
```

- User adds notes in rapid succession → only the last timer survives
- 3s quiet window → single wiki sync fires once with ALL notes now on NFS
- Aria reads all notes (not just the triggering one) when building the update

## Edge cases

### Multiple users adding notes simultaneously

Internal tool, small team — low risk. If two users add notes to the same deal
within the 3s window:

- Each note write is atomic (separate NFS files, no conflict)
- Debounce per dealId: whichever write lands last resets the timer
- Wiki sync reads ALL notes from NFS — sees both users' notes
- No data loss; both contributions included in the wiki update

**If needed at scale**: Replace in-memory debounce with a Redis key
`wiki-sync:{dealId}` with 3s TTL. Not needed now.

### API scales to multiple Cloud Run instances

In-memory debounce doesn't cross instance boundaries. Each instance has its own
`Map`. At current scale (single min-instance, small team), this is not a problem.

**Fix when needed**: Redis `SET NX EX` distributed lock + delayed job pattern.
Requires adding Cloud Memorystore (Redis) to the stack.

### Aria gateway is down

Wiki sync is fire-and-forget. Note write succeeds regardless. Sync just silently
fails. No retry currently.

**Future**: Write a `.pending-wiki-sync` marker to the deal's NFS folder on failure.
A periodic job or the next note-add picks it up and retries.

### Note deleted before sync fires

If a note is deleted within the 3s debounce window, the sync fires anyway and reads
whatever is on NFS at that point (deleted file is already gone). Correct behavior —
wiki reflects current state.

### User spams notes across multiple deals

Debounce is per `dealId` — each deal has its own independent timer. No cross-deal
interference.

## What Aria does on [CRM_WIKI_SYNC]

1. Fetch deal details from CRM internal API (title, stage, companyId)
2. Read all notes from `/share/crm/deals/{dealId}/` (all categories, all files)
3. Read company index.md for context (`/share/crm/companies/{companyId}/index.md`)
4. Update deal `index.md` — synthesize key facts, decisions, open questions
5. Update company `index.md` if deal details changed
6. Update `MASTER_INDEX.md` deal row (stage, source count)
7. Fire `[CRM_SUMMARY]` to regenerate summary from updated notes
8. Append to deal `log.md`

All steps run inside Aria's session. No response expected by the CRM API.

## Why not full crm-ingest?

`crm-ingest` is designed for raw unstructured input (voice note, email dump,
transcript) — it parses, extracts facts, and structures content before writing.
UI-saved notes are already structured. Running full crm-ingest would re-parse
already-clean content unnecessarily.

`[CRM_WIKI_SYNC]` skips parsing and goes straight to the wiki update phase
(equivalent to steps 4–12 of crm-ingest).
