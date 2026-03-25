export type StageId = 'lead' | 'disc' | 'asm' | 'prop' | 'fup' | 'won' | 'lost'

export type Stage = {
  id: StageId
  label: string
  color: string
}

export type DealCategory = 'Inbound' | 'Outbound'

export type Deal = {
  id: number
  brand: string
  name: string
  project: string
  category: DealCategory
  stage: StageId
  size: number
  industry: string
  services: string[]
  am: string
  dateCaptured: string
  lastActivity: string
  daysInStage: number
  proposalUrl?: string
  demoUrl?: string
  nextStep?: string
  nextDate?: string
  notes: Record<string, NoteEntry[]>
  timeline: TimelineEntry[]
}

export type NoteEntry = {
  author: string
  time: string
  type: string
  color: string
  title: string
  body: string
  tags: string[]
}

export type TimelineEntry = {
  color: string
  text: string
  time: string
}

export type Thread = {
  id: number
  from: string
  email: string
  subject: string
  preview: string
  date: string
  channel: 'email' | 'messenger' | 'viber'
  unread: boolean
  dealIds: number[]
}

export const STAGES: Stage[] = [
  { id: 'lead', label: 'Lead', color: '#94a3b8' },
  { id: 'disc', label: 'Discovery', color: '#2563eb' },
  { id: 'asm', label: 'Assessment', color: '#7c3aed' },
  { id: 'prop', label: 'Demo + Proposal', color: '#d97706' },
  { id: 'fup', label: 'Follow-up', color: '#f59e0b' },
  { id: 'won', label: 'Won', color: '#16a34a' },
  { id: 'lost', label: 'Lost', color: '#dc2626' },
]

export const BRAND_COLORS: Record<string, string> = {}

export const AM_GRADIENTS: Record<string, string> = {}

export function getStage(id: StageId): Stage {
  return STAGES.find((s) => s.id === id)!
}
