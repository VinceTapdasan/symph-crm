# Symph CRM — Roadmap

**Last Updated:** 2026-05-04

---

## Phase Overview

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Foundation — Auth, Pipeline, Notes, AI Pitch Deck | Complete |
| Phase 2 | CRM Depth — Tasks, Analytics, Email, Dormancy Flags | **In Progress** (5/8 shipped) |
| Phase 3 | Knowledge Graph — Wikilinks, Graph View, Global Search | **In Progress** (4/6 shipped) |
| Phase 4 | AI & Automation — Enrichment, Summaries, PRD Generation | **Started** (1/7 shipped) |
| Phase 5 | Integrations & Scale — Slack, Zoom, API, Mobile | **Started** (1/6 shipped) |

---

## Phase 1 — Foundation (Complete)

All items shipped and live at `crm.dev.apps.symph.co`.

- [x] Authentication — email/password + Google OAuth (NextAuth v5)
- [x] RBAC — super_admin, admin, manager, rep, viewer
- [x] User management — invite, assign roles
- [x] Multi-workspace architecture
- [x] Company records — full profile, contacts, deals, activity timeline
- [x] Contact management per company
- [x] Deal pipeline — Kanban drag-and-drop, 7 stages (+ Parked stage added 2026-04-20)
- [x] Deal detail — edit form, notes tab, activity feed
- [x] Notes — Markdown, linked to deals/companies/contacts, pinnable, tags
- [x] File attachments on notes
- [x] Activity/audit log — 19+ event types with JSONB metadata
- [x] Product catalog — 7 Symph products x 3 tiers
- [x] Dashboard KPIs — pipeline value, active deals, win rate, avg deal size
- [x] AM roster per workspace — assignment tracking
- [x] Custom pipeline stages per workspace
- [x] AI pitch deck generator (Claude API)
- [x] Demo site generator (shareable /demo/[token])
- [x] CSV import with duplicate detection
- [x] Chat interface (Aria SDK streaming, shipped 2026-03-26)
- [x] Mobile responsive layout
- [x] VPS deployment (now Cloud Run + Cloud Build)

---

## Phase 2 — CRM Depth

### TASK-P2-001 — Dormancy Flags + Follow-up Automation — **Partially Shipped**
- [x] Dormancy sweep module (NestJS, 2026-03-26)
- [ ] 1-day unreplied flag surfaced in UI
- [ ] 3-day AM alert
- [ ] Manager escalation after 3 unanswered cycles
- [ ] Auto-draft follow-up message

### TASK-P2-002 — Task & Activity Management — **Not Started**
- [ ] Tasks (call, email, meeting, to-do) on any CRM object
- [ ] Due dates + reminder alerts
- [ ] AM task view
- Note: foundation exists via audit logging + timeline UI; tasks-as-first-class missing.

### TASK-P2-003 — Pipeline Analytics — **Partially Shipped**
- [x] Stage conversion funnel from historical audit_logs (2026-04-02)
- [x] Win rate KPI + lead stage in funnel
- [x] Dashboard date filters (month/year + Lifetime, default Lifetime)
- [ ] Average time in stage
- [ ] Rep performance dashboard
- [ ] AM leaderboard

### TASK-P2-004 — Gmail Integration — **Shipped**
- [x] Gmail OAuth (2026-03-30)
- [x] Inbox UI — chat-style multi-channel redesign
- [x] Compose + send from CRM
- [x] Thread actions (archive, trash, email back)
- [x] 7-day / 3-week thread window
- [ ] Auto-link email threads to deal records
- [ ] Open/click tracking

### TASK-P2-005 — Proposal Auto-Versioning — **Partially Shipped**
- [x] Proposal Builder (Tiptap) — Phase 4 build (2026-03-26)
- [x] Editable links, brand color, unsaved changes guard
- [ ] Per-deal version history (v1, v2, v3...)
- [ ] Auto-generate diff summary between versions
- [ ] Loss reason capture on close after price negotiation

### TASK-P2-006 — Note Versioning — **Not Started**
- [ ] Full edit history per note
- [ ] Restore to any prior version

### TASK-P2-007 — Custom Properties — **Not Started**
- [ ] User-defined fields on companies, contacts, deals
- [ ] Field types: text, number, date, select
- [ ] Filterable in pipeline and deal list views

### TASK-P2-008 — Meeting Scheduler — **Partially Shipped**
- [x] Google Calendar two-way sync (2026-03-26)
- [x] Calendar page — week view, time indicator, 15-min picker
- [x] Google Calendar-style event creation popover
- [ ] Shareable AM booking links
- [ ] Embed link in email templates

---

## Phase 3 — Knowledge Graph

### TASK-P3-001 — Bidirectional Note Linking — **Mostly Shipped**
- [x] Karpathy wiki vault — WikiService + 4 API endpoints (2026-04-08)
- [x] Wiki page — Obsidian-style 3-level tree + URL routing
- [x] Notes wired to NFS (read/write/delete from filesystem)
- [x] Wiki-aware chat prompt for Aria
- [x] Debounced wiki sync on UI note save
- [ ] `[[wikilink]]` parser auto-resolving to CRM objects
- [ ] Backlinks panel on every record

### TASK-P3-002 — Tags System — **Partially Shipped**
- [x] Wiki tabs across 7 note categories (2026-04-08)
- [ ] Inline `#tag` parser
- [ ] Tag filter views
- [ ] Tag cloud on dashboard

### TASK-P3-003 — Global Search (⌘K) — **Shipped**
- [x] Cmd+K palette (2026-03-27)
- [x] Brand-name search in pipeline
- [x] Pipeline main search matches AM display names
- [x] DataTable for audit logs with search
- [ ] Cross-object ranked relevance (notes + deals + companies + contacts in one palette)

### TASK-P3-004 — Graph View — **Shipped**
- [x] D3 force simulation deals graph (2026-03-26)
- [x] Obsidian layout, 7-stage legend, brand click-through
- [x] Ctrl+F search + highlighting + zoom-to-fit
- [x] Search no longer flickers/spreads nodes (2026-03-30)
- [x] Full-width graph view (no longer squeezed in sidebar)

### TASK-P3-005 — Note Templates — **Not Started**
- [x] 7 fixed wiki categories present
- [ ] User-defined templates (Discovery, Objection, Recap, Proposal Summary)
- [ ] `/` command insertion in editor

### TASK-P3-006 — Daily Notes — **Not Started**
- [ ] Auto-generated per rep each day
- [ ] Auto-linked to that day's deals/tasks/meetings

---

## Phase 4 — AI & Automation

### TASK-P4-001 — AI Lead Enrichment — **Not Started**
- [ ] Auto-research company (size, industry, funding, tech stack)
- [ ] Risk + opportunity signals
- [ ] Product fit scoring

### TASK-P4-002 — AI Meeting Summaries / Note Summaries — **Partially Shipped**
- [x] Async deal summary generation via Aria `crm-summarize-deal` skill (2026-04-13)
- [x] Direct summary generation via Anthropic API from NFS notes
- [x] Note summary UI in deal details
- [x] Stale-summary detection via notesIncluded count
- [x] Voice notes — audio capture, Supabase persistence, transcription retry (2026-03-30)
- [ ] Zoom / call-recording transcription
- [ ] Auto-extract requirements / pain points / action items

### TASK-P4-003 — PRD Generation Post-Close — **Not Started**
- [ ] On Closed Won: auto-generate build-ready PRD
- [ ] AM review flow
- [ ] Discord notification to build team

### TASK-P4-004 — Smart Note Suggestions — **Not Started**
- [ ] Inline related-record surfacing
- [ ] pgvector semantic search

### TASK-P4-005 — Sequence Automation — **Not Started**
- [ ] Multi-step sequences (email, task, call)
- [ ] Branch logic on reply/no reply

### TASK-P4-006 — Knowledge Handoff — **Partially Shipped**
- [x] People dossier notes endpoint + query hook (2026-04-07)
- [ ] Auto-generated dossier on owner change

### TASK-P4-007 — Competitive Intelligence Hub — **Not Started**

---

## Phase 5 — Integrations & Scale

### TASK-P5-001 — Slack Integration — **Not Started**
- [x] Discord ID linking on users (2026-04-07) — adjacent infrastructure
- [ ] Slack deal update notifications
- [ ] `/crm` slash commands

### TASK-P5-002 — Zoom / Google Meet — **Not Started**
- [x] Google Calendar integration done (covers part of scheduler)
- [ ] Meet/Zoom auto-summary push to deal

### TASK-P5-003 — Zapier / Make — **Not Started**

### TASK-P5-004 — REST API — **Shipped (internal/owner tiers)**
- [x] Full internal API — 35 routes for Aria CRM access (2026-04-01)
- [x] Aria CRM access TypeScript client (2026-03-30)
- [x] Owner API key access layer `/api/owner/*` (2026-04-27)
- [x] Cloud Run secret injection for `OWNER_API_KEY`
- [ ] Public OAuth 2.0 API for third-party use

### TASK-P5-005 — HubSpot Migration Tool — **Not Started**

### TASK-P5-006 — Mobile App / PWA — **Attempted, Disabled**
- [x] Next.js PWA setup + icons + Apple Web App metadata
- [x] Mobile-first inbox + full-screen compose
- [x] Mobile deal detail header with segmented progress bar
- [x] Mobile tab scroll, name truncation, flush cards
- [ ] **PWA disabled 2026-04-23** — `@ducanh2912/next-pwa@10` generates `_async_to_generator` without bundling helper, crashing SW in Next.js 15. Needs replacement (e.g. Serwist) or upstream fix.
- [ ] Voice note → transcript → deal log (transcription exists; not wired to mobile capture)
- [ ] Native iOS/Android (deferred)

---

## Beyond Original Roadmap — Shipped Since 2026-03-25

These weren't in the original phases but landed in the last 6 weeks. Capture here so they don't get lost.

### Architecture & Infra
- **Hybrid NFS + Supabase storage** (2026-04-06) — NFS-primary for all files, Supabase for voice only; markdown migrated from Supabase Storage to NFS
- **Three-layer data fetching architecture** (2026-03-31) — codified in `frontend.md` rules; all features use api → hook → component
- **Cloud Run + Cloud Build CI/CD** (2026-03-25) — production deploy with custom domain
- **Shared VPC + NFS mount** for API on Cloud Run (2026-04-07)
- **PostHog analytics** integrated in production (2026-04-16)
- **RBAC backend guard + frontend gating** (2026-03-30)
- **Onboarding gate** with team-only flow (2026-04-02)

### Aria / AI Integration
- **Aria SDK streaming chat** (2026-03-26) — replaced mock AI
- **Multimodal input** — file, image, voice support in chat (2026-03-25)
- **Audio visualizer + MIME validation** in chat
- **Chat sessions** — persistent typing indicator, unread badges, URL persistence, session sidebar
- **Aria CRM access routes** + TypeScript client for skill use
- **CRM links in tool results** for create/update ops

### Pipeline / Deals
- **Stage conversion funnel** from historical audit_logs
- **Smart deal name formatting** with acronym detection
- **Parked stage** added after Follow-up
- **Brand hierarchy** — `parent_id` on companies
- **Brand combobox with inline create** in deal modals
- **Service types + industry combobox** in deal detail
- **Forward-only kanban drag** constraint enforced

### Documents & Notes
- **Markdown viewer** — Obsidian-style with remark-breaks
- **Document viewer modal** — image/audio preview, inline editing for notes/txt/md, near-full viewport
- **Paste chip** for bulk text + multiple chips + ESC to close preview
- **DataTable brands view**
- **Document list/grid view** with stage badges, uploader identity, AM lock for won/lost
- **Audit all docs** + tab URL sync

### Calendar & Inbox
- **Google Calendar week view** + event detail panel + 15-min time picker
- **Multi-channel inbox redesign** — chat-style UI
- **Inbox dark mode + connect banner**
- **Email body cleaning** + native rendering

### People / Brands
- **People dossier notes** endpoint + UI
- **Edit and delete contacts** in People tab
- **Brand detail modal** + slide-over panel
- **Brand color** on proposals, editable links, team demo calendar

### Billing
- **Billing summary + bills page** — annual/monthly/milestone (2026-04-01)
- **Bill edit modal**

### UX / Polish
- **Dark mode** — systematic audit, blue primary, theme toggle, dark stage colors at Tailwind 400
- **Cmd+K** topbar palette
- **Lucide icons** standardization
- **Twitter-style top loader**
- **Focus ring audit** — `ring-3 → ring-1 + ring-inset` across all shadcn components
- **Logout confirmation modal**
- **Mobile-first** responsive layout end-to-end

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Graph DB: stay on Postgres graph layer long-term vs. move to Neo4j? | Vince | Assumed Postgres — revisit at 500K+ nodes |
| 2 | AI summaries: build in-house (Anthropic) vs. partner with Fireflies.ai? | Gee | Resolved — built in-house via Aria + Anthropic |
| 3 | Pricing model for external SaaS: seat-based vs. workspace-based? | Gee | Open |
| 4 | Mobile: PWA acceptable at Phase 5 or native required? | Vince | PWA attempted, blocked by Next.js 15 SW bug — decide: fix (Serwist?), defer, or go native |
| 5 | Email sync priority: ship analytics first, then Gmail? | Gee | Resolved — both shipped in Phase 2 |
| 6 | Kate — confirm on AM roster | Gee | Open |
| 7 | Replace `@ducanh2912/next-pwa` with Serwist for PWA? | Vince | Open — blocks TASK-P5-006 |
| 8 | Public OAuth 2.0 API priority vs. owner-key sufficient for now? | Vince | Open |

---

## Immediate Next Up (Suggested)

Based on partial completions and open user-facing gaps:

1. **TASK-P2-002 — Tasks** — only major Phase 2 item with zero progress; needed for AM/manager visibility
2. **TASK-P2-001 — finish dormancy UI surfacing + alerting** — sweep module exists, no UI
3. **TASK-P2-003 — rep / AM leaderboard + time-in-stage** — funnel done, performance views missing
4. **TASK-P3-001 — `[[wikilink]]` parser + backlinks panel** — wiki infra done, linking semantics not
5. **PWA recovery** — pick Serwist or accept native-only path

---

*Maintained by Vince Tapdasan. Update after every sprint or product decision.*
