/**
 * POST /api/chat/aria
 *
 * Streams AI responses via the Aria gateway.
 * 1. POSTs message to /v1/chat/send → gets session_id
 * 2. Opens SSE stream from /v1/chat/stream → pipes to client
 *
 * Request body:
 * {
 *   content: string
 *   userId?: string
 *   userName?: string
 *   sessionId?: string
 *   workspaceId?: string
 *   dealId?: string
 *   attachment?: { filename: string; mimeType: string }
 * }
 *
 * Response: Server-Sent Events (text/event-stream)
 * event: text\ndata: {"text":"..."}\n\n
 * event: action\ndata: {...}\n\n
 * event: activity\ndata: {...}\n\n
 * event: done\ndata: {}\n\n
 * event: error\ndata: {"message":"..."}\n\n
 */

import { NextRequest, NextResponse } from 'next/server'

const GATEWAY_URL = (process.env.ARIA_GATEWAY_URL ?? 'https://aria-gateway.symph.co').replace(
  /\/+$/,
  '',
)
const INTERNAL_BASE = 'https://symph-crm-api-t5wb3mrt7q-as.a.run.app/api/internal'

export async function POST(req: NextRequest) {
  const apiToken = process.env.ARIA_API_TOKEN
  if (!apiToken) {
    return NextResponse.json({ error: 'ARIA_API_TOKEN not configured' }, { status: 500 })
  }

  let body: {
    content?: string
    userId?: string
    userName?: string
    sessionId?: string
    workspaceId?: string
    dealId?: string
    attachment?: { filename: string; mimeType: string }
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { content, userId, userName, sessionId, workspaceId, dealId, attachment } = body

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  // Aria gateway does not accept raw base64 — note attachments inline
  let messageContent = content
  if (attachment) {
    messageContent += `\n\n[Attachment: ${attachment.filename} (${attachment.mimeType})]`
  }

  // Build CRM system prompt additions
  const ws = workspaceId ?? ''
  const internalSecret = process.env.INTERNAL_SECRET

  const promptLines: string[] = [
    '## Symph CRM Assistant',
    '',
    'You are Aria, acting as a CRM sales assistant for Symph — an AI-native software engineering agency based in the Philippines. Help Account Managers (AMs) track deals, manage companies, and capture client interactions.',
    '',
    '## Session context',
    `- User ID: ${userId ?? 'unknown'}`,
    `- Workspace: ${ws || 'unknown'}`,
    `- Active deal: ${dealId ?? 'none'}`,
  ]

  if (internalSecret && ws) {
    promptLines.push(
      '',
      '## CRM data access',
      'Use the api_caller tool to look up or modify CRM data. All requests require:',
      `- Base URL: ${INTERNAL_BASE}`,
      `- Header: X-Internal-Secret: ${internalSecret}`,
      `- Workspace filter: workspaceId=${ws}`,
      '',
      'Key endpoints:',
      `- GET /deals?workspaceId=${ws}&limit=20 — list recent deals`,
      '- GET /deals/{dealId} — deal details',
      `- GET /companies/search?q={query}&workspaceId=${ws} — search companies`,
      '- GET /activities?dealId={dealId}&limit=20 — deal activity log',
      '- PATCH /deals/{dealId} — update deal (stage, value, probability, closeDate)',
    )
  }

  promptLines.push(
    '',
    '## Guidelines',
    '- Be concise and action-oriented.',
    '- Currency is PHP (Philippine Peso).',
    '- Confirm what you did after using CRM tools.',
  )

  const systemPromptAdditions = promptLines.join('\n')

  // Namespace CRM sessions so they don't collide with other Aria sessions
  const ariaSessionId = sessionId
    ? `crm-${sessionId}`
    : `crm-web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Step 1: send message to Aria
  let ariaResolvedSessionId: string
  try {
    const sendResp = await fetch(`${GATEWAY_URL}/v1/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        session_id: ariaSessionId,
        content: messageContent,
        user_id: userId,
        user_name: userName,
        // Assert T3 so the gateway honours system_prompt_additions.
        // Safe: this route is already gated by ARIA_API_TOKEN (server-side only).
        user_tier: 3,
        workspace_path: '/share/agency/products/symph-crm',
        system_prompt_additions: systemPromptAdditions,
      }),
    })

    if (!sendResp.ok) {
      const errText = await sendResp.text()
      return NextResponse.json(
        { error: `Aria gateway send error: ${sendResp.status} ${errText}` },
        { status: sendResp.status },
      )
    }

    const result = (await sendResp.json()) as { session_id: string; seq: number }
    ariaResolvedSessionId = result.session_id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to reach Aria gateway: ${msg}` }, { status: 502 })
  }

  // Step 2: open SSE stream from Aria and pipe to client
  const streamUrl = new URL(`${GATEWAY_URL}/v1/chat/stream`)
  streamUrl.searchParams.set('session_id', ariaResolvedSessionId)

  let streamResp: Response
  try {
    streamResp = await fetch(streamUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'text/event-stream',
      },
    })

    if (!streamResp.ok) {
      const errText = await streamResp.text()
      return NextResponse.json(
        { error: `Aria gateway stream error: ${streamResp.status} ${errText}` },
        { status: streamResp.status },
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to open Aria stream: ${msg}` }, { status: 502 })
  }

  // Pipe the SSE stream line-by-line to the client
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const reader = streamResp.body?.getReader()
      if (!reader) {
        controller.enqueue(
          encoder.encode('event: error\ndata: {"message":"No response body from gateway"}\n\n'),
        )
        controller.close()
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            controller.enqueue(encoder.encode(line + '\n'))
          }
        }

        // Flush remainder
        const remaining = buffer + decoder.decode()
        if (remaining.trim()) {
          controller.enqueue(encoder.encode(remaining + '\n'))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
