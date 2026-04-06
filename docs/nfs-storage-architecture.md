# CRM Document Storage — NFS Architecture

## Overview

Symph CRM stores markdown document content on Aria's shared NFS volume instead
of Supabase Storage. This gives Aria direct filesystem access to all deal notes,
transcripts, and AI context documents — enabling real-time grep, compounding
deal wikis, and zero-latency reads without HTTP roundtrips.

Binary attachments (images, audio) remain in Supabase Storage where CDN delivery
and signed URLs are needed.

## Storage Layers

```
┌─────────────────────────────────────────────────────────┐
│  Postgres (Supabase)                                    │
│  documents table: id, deal_id, title, type,             │
│  storage_path, excerpt, word_count, ...                 │
│  → metadata only, no content                            │
└─────────────────────────────────────────────────────────┘
                          │
              storage_path (e.g. deals/{id}/context.md)
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────────┐
│  NFS — /share   │               │  Supabase Storage   │
│  (Aria's NFS)   │               │  (attachments)      │
│                 │               │                     │
│  /share/crm/    │               │  bucket: attachments│
│    deals/       │               │  images, audio,     │
│    companies/   │               │  binary files       │
│    contacts/    │               │                     │
│    workspace/   │               │                     │
└─────────────────┘               └─────────────────────┘
  markdown (.md)                    binary blobs
  AI reads directly                 signed URLs for browser
  git-trackable                     CDN delivery
```

## File Layout on NFS

```
/share/crm/
  deals/{dealId}/
    context/context-{ts}.md      ← AI-maintained deal summary (upserted)
    general/general-{ts}.md      ← General notes
    meeting/meeting-{ts}.md      ← Meeting notes
    transcript_raw/transcript_raw-{ts}.md  ← Raw call transcripts
    proposal/proposal-{ts}.md    ← Proposals
  companies/{companyId}/
    {type}/{type}-{ts}.md
  contacts/{contactId}/
    {type}/{type}-{ts}.md
  workspace/{workspaceId}/
    {type}-{ts}.md               ← Workspace-level docs (no entity)
```

The `storage_path` column in the `documents` table stores the relative path
(e.g. `deals/abc-123/context/context-1744000000000.md`). The full NFS path is
resolved as `{NFS_MOUNT_PATH}/crm/{storage_path}`.

## Why NFS Over Object Storage

| | Supabase Storage | NFS (Aria's /share) |
|---|---|---|
| Read latency | ~50–200ms (HTTP) | ~1–5ms (filesystem) |
| Aria reads | API call required | Direct `fs.readFile()` |
| Bulk search | N HTTP calls | `grep -r` (single syscall) |
| Version history | None | git-trackable |
| Rate limits | Yes | No |
| Binary attachments | Best fit (CDN, signed URLs) | Not used for binaries |

## Network Architecture

CRM's Cloud Run services run on Aria's `aria-vpc` (Shared VPC), giving them
direct access to the Filestore at `10.95.69.154`.

```
symph-crm Cloud Run
  └─ VPC: projects/symph-aria/global/networks/aria-vpc
  └─ Subnet: aria-subnet (10.0.0.0/20)
  └─ NFS mount: 10.95.69.154:/share → /share

Aria Agent Worker
  └─ VPC: aria-vpc / aria-subnet
  └─ NFS mount: 10.95.69.154:/share → /share

Symphony Portal (aria-agency-portal)
  └─ VPC: aria-vpc / aria-subnet
  └─ NFS mount: 10.95.69.154:/share → /share
```

All three services read and write the same physical filesystem. No sync,
no replication — same bytes.

## Firewall Rules

CRM is restricted to NFS access only within Aria's network:

```
Rule: aria-allow-nfs-crm
  Network:   aria-vpc (symph-aria)
  Direction: INGRESS
  Source:    10.148.0.0/20 (symph-crm subnet, pre-Shared VPC)
  Allow:     tcp:2049 (NFS) only
```

CRM services cannot reach Aria's gateway, agent worker, or any other internal
service — only the Filestore on port 2049.

## Migration Compatibility

`StorageService.readMarkdown()` tries NFS first, then falls back to Supabase
Storage. This means documents written before the migration are still readable.
All new writes go to NFS only.

To migrate existing documents off Supabase Storage, run:

```typescript
// One-time migration script (not yet written)
// For each document: readMarkdown() → writeMarkdown() → verify → remove from Supabase
```

## Accessing CRM Markdown Files

### From Aria (direct)

```bash
# Read a specific deal's AI context
cat /share/crm/deals/{dealId}/context/context-*.md

# Search across all deals
grep -r "budget concerns" /share/crm/deals/

# List all documents for a deal
ls /share/crm/deals/{dealId}/
```

### From the CRM API

```
GET /api/internal/documents/{id}/content
```

Returns the markdown content as a string. Resolved via `storage_path` in DB.

### From the CRM Frontend

The document viewer calls the content endpoint above and renders markdown in
the `DocumentViewerModal`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NFS_MOUNT_PATH` | `/share` | Root of the NFS mount inside the container |

`CRM_NFS_PATH` is derived as `{NFS_MOUNT_PATH}/crm` inside `StorageService`.

## Related Files

- `apps/api/src/storage/storage.service.ts` — dual-backend storage implementation
- `apps/api/src/documents/documents.service.ts` — document CRUD using StorageService
- Cloud Run service: `symph-crm-api` (project: `symph-crm`, region: `asia-southeast1`)
- NFS Filestore: `aria-filestore` (project: `symph-aria`, IP: `10.95.69.154`)
