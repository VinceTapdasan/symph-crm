# Aria Integration — CRM Chat Architecture

> Written: 2026-04-03
> Authors: Aria + Vins (vincetapdasan)
> Status: Active — reflects the fixed integration as of commit `96165a6`

---

## Overview

Symph CRM's AI chat runs through **Aria** — Symph's internal AI platform — rather than calling Anthropic directly. The CRM is a trusted web client of the Aria gateway: it sends messages and streams responses over HTTP/SSE, while all model calls, tool execution, and session state live in Aria's infrastructure.

---

## Request Flow

```
User (browser)
  |
  |  POST /api/chat/aria
  v
Next.js Route Handler
(apps/web/src/app/api/chat/aria/route.ts)
  | - validates session, resolves deal/user context
  | - builds system_prompt_additions
  |
  |  POST /v1/chat/send          [step 1]
  v
Aria Gateway
(aria-gateway-canary-7xgremp6pq-as.a.run.app)
  | - authenticates via Bearer token (ARIA_API_TOKEN)
  | - creates/resumes Firestore session
  | - enqueues message to agent worker
  |
  |  GET /v1/chat/stream         [step 2]
  v
Aria Gateway SSE stream
  | - streams agent responses as named SSE events
  | - heartbeats every 15s to keep connection alive
  |
  v
Next.js Route Handler (pipes SSE line-by-line to client)
  |
  v
Chat.tsx (browser)
  - reads response body as stream
  - parses SSE named events, renders text in real time
```

---

## Gateway Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/v1/chat/send` | Deliver user message, create/resume session |
| `GET` | `/v1/chat/stream?session_id=...` | SSE stream for real-time agent replies |
| `GET` | `/v1/chat/history?session_id=...&after_seq=N` | Polling fallback (used by NestJS API path) |

---

## SSE Event Format

The gateway emits **named SSE events** — not a wrapped JSON format. Each message looks like:

```
id: 1
event: text
data: {"text":"Hello, here is what I found..."}

id: 2
event: done
data: {}

```

Event types:

| Event | Payload | Meaning |
|-------|---------|---------|
| `text` | `{ text: string }` | Incremental text chunk from the agent |
| `action` | `{ type: string, payload: object }` | Tool call executed |
| `activity` | `{}` | Typing indicator on |
| `activity_end` | `{}` | Typing indicator off |
| `done` | `{}` | Agent finished — client should close the stream |
| `error` | `{ message: string }` | Agent-level error |

---

## Session Identity

Sessions are namespaced with a `crm-` prefix in Aria's Firestore:

```
crm-{sessionId}                        // when a sessionId is provided
crm-web-{timestamp}-{random}           // when starting fresh
```

---

## System Prompt Injection

Before each send, the Next.js route builds `system_prompt_additions` — a block of text injected into Aria's context containing CRM-specific instructions:

- Who the user is (name, ID)
- Which deal is active
- The internal API base URL and auth secret so Aria can call CRM endpoints

This is only honoured by the gateway when `user_tier >= 3`. The CRM asserts `user_tier: 3` in the send body — safe because the route is already server-side and authenticated via `ARIA_API_TOKEN`.

---

## Environment Variables

| Variable | Service | Source |
|----------|---------|--------|
| `ARIA_GATEWAY_URL` | web + api | `https://aria-gateway-canary-7xgremp6pq-as.a.run.app` |
| `ARIA_API_TOKEN` | web + api | Secret `symph-crm-aria-api-token` in `symph-crm` GCP |
| `INTERNAL_SECRET` | api | Shared secret for Aria -> CRM internal API calls |

> There is no `aria-gateway.symph.co` DNS record. Always use the raw Cloud Run URL.

---

## Key Files

```
apps/web/src/app/api/chat/aria/route.ts   Next.js route (relay + SSE pipe)
apps/web/src/components/Chat.tsx           SSE parser + streaming UI
apps/api/src/chat/chat.service.ts          NestJS service (polling path)
apps/api/src/chat/chat.module.ts           Module wiring
```

---

## Migration from Direct Anthropic SDK

The original implementation used `@anthropic-ai/sdk` directly — hardcoded tools, a local agentic loop, Anthropic API key in CRM secrets. Replaced with the gateway because:

- No API key management in CRM — only a gateway token
- All model calls, tool execution, and session state live in Aria's infra
- Model/prompt upgrades deploy to Aria without CRM changes
- Consistent with how all other Symph products use AI

---

## What Broke and How It Was Fixed

### 1. DNS failure — `fetch failed`

**Symptom:** `"Failed to reach Aria gateway: fetch failed"` in API logs.

**Cause:** Gateway URL was set to `https://aria-gateway.symph.co` — a DNS record that does not exist.

**Fix:** Updated `ARIA_GATEWAY_URL` on both Cloud Run services to the actual Cloud Run hostname.

---

### 2. SSE format mismatch — responses never displayed

**Symptom:** Chat showed blank messages or hung silently. No text ever appeared.

**Cause:** `Chat.tsx` was written for a legacy wrapped-JSON format:
```
data: {"type":"text","data":{"text":"hello"}}
```
The gateway uses proper SSE named events:
```
event: text
data: {"text":"hello"}
```
The parser only read `data:` lines and looked for `event.type` in the JSON body — which doesn't exist in the gateway format. Every response was silently discarded.

Two compounding bugs:
- `throw new Error('Stream error')` was inside a `try/catch` that swallowed it, making gateway errors invisible.
- The `done` event was never handled, so the connection hung open until timeout.

**Fix (`Chat.tsx`):**
- Track `event: xxx` lines to capture the event type before the data line arrives.
- Parse `data:` payload using that event type as context.
- On `done`: call `reader.cancel()` and break the loop.
- Re-throw errors from `event: error` (not swallowed).

---

### 3. Missing `user_tier: 3` — system prompt stripped silently

**Symptom:** Aria responded but had no CRM context — didn't know the deal, user, or available tools.

**Cause:** The gateway strips `system_prompt_additions` for callers with `user_tier < 3`. Without an explicit tier in the request body, callers default to T1.

```typescript
// gateway source
const allowSystemPromptAdditions = resolvedTier >= 3
```

**Fix:** Added `user_tier: 3` to the `/v1/chat/send` body in both `route.ts` and `chat.service.ts`.

---

### 4. History response shape mismatch — NestJS polling always empty

**Symptom:** `ChatService.pollForReply()` always returned empty regardless of what Aria responded.

**Cause 1:** The history endpoint returns `{ session_id, entries: [...] }` but the service cast the whole body as the array and iterated it directly — causing a silent TypeError.

**Cause 2:** `pollForReply` was called with `inbox_seq + 1` as the `after_seq` argument. Inbox and outbox sequences are independent counters. The poll was filtering the outbox by an inbox number, which always returned nothing.

**Fix (`chat.service.ts`):**
```typescript
// Before
entries = (await resp.json()) as typeof entries

// After
const body = await resp.json()
entries = Array.isArray(body.entries) ? body.entries : []
```
And poll starting at `after_seq=0` (not the inbox seq).

---

### 5. Secret accessor permission missing — `ARIA_API_TOKEN not configured`

**Symptom:** `API error 500: {"error":"ARIA_API_TOKEN not configured"}` at runtime, even after the secret was wired to Cloud Run.

**Cause:** The Cloud Run default compute SA (`188047996224-compute@developer.gserviceaccount.com`) was not granted `roles/secretmanager.secretAccessor` on the `symph-crm-aria-api-token` secret. GCP silently mounts the env var as `undefined` when the SA lacks read permission.

**Fix:**
```bash
gcloud secrets add-iam-policy-binding symph-crm-aria-api-token \
  --member="serviceAccount:188047996224-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=symph-crm
```
Both services were redeployed (`web-00156-zrr`, `api-00168-jtz`) to pick up the new binding.

---

## Known Limitations

- **No session persistence across page loads.** `sessionId` in `Chat.tsx` is never persisted, so every page load starts a new Aria session and conversation history resets.
- **NestJS API path is polling-only.** `ChatService` polls `/v1/chat/history` at 500ms intervals (120s timeout) rather than streaming. Adds latency but is simpler to implement.
- **Stream stays open after `done`.** The gateway does not close the SSE connection after sending `done`. The client calls `reader.cancel()` to close its side, but the server-side connection lingers until the heartbeat detects the disconnect.
