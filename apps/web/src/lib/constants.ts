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

export const BRAND_COLORS: Record<string, string> = {
  Mlhuillier: '#1e40af',
  RCBC: '#16a34a',
  NCC: '#d97706',
  PenBrothers: '#2563eb',
  Jollibee: '#dc2626',
  Ayala: '#0f766e',
}

export const AM_GRADIENTS: Record<string, string> = {
  Gee: '#1e293b',
  Mary: '#0f766e',
  Lyra: '#b45309',
  Vince: '#1d4ed8',
}


export function getStage(id: StageId): Stage {
  return STAGES.find((s) => s.id === id)!
}

export const DEALS: Deal[] = [
  {
    id: 1,
    brand: 'Mlhuillier',
    name: 'Asys Digital Platform',
    project: 'Asys Deal',
    category: 'Inbound',
    stage: 'prop',
    size: 2_500_000,
    industry: 'Financial Services',
    services: ['The Agency', 'Consulting'],
    am: 'Gee',
    dateCaptured: 'Feb 14, 2026',
    lastActivity: '2h ago',
    daysInStage: 5,
    proposalUrl: '#',
    demoUrl: '#',
    nextStep: 'Follow up with Sir Ricky on board approval',
    nextDate: 'Mar 24, 2026',
    notes: {
      disc: [
        { author: 'Gee', time: 'Feb 14', type: 'call', color: '#2563eb', title: 'Discovery call with Sir Ricky + IT Head', body: 'Legacy Oracle loyalty system. No mobile app. Need full modernization.', tags: ['call', 'circleback'] },
        { author: 'Mary', time: 'Feb 16', type: 'email', color: '#16a34a', title: 'Post-discovery email thread', body: 'Sir Ricky requested agency credential deck and case studies.', tags: ['email'] },
      ],
      asm: [
        { author: 'Gee', time: 'Feb 18', type: 'note', color: '#7c3aed', title: 'Internal assessment with Raven + Ian', body: 'Strong fit. Stack: Next.js + Firebase. 3-month build estimate.', tags: ['internal'] },
      ],
      prop: [
        { author: 'Gee', time: 'Feb 22', type: 'call', color: '#d97706', title: 'Demo walkthrough with Aria prototype', body: 'Sir Ricky loved mobile UI (9/10). Requested pricing by end of week.', tags: ['demo', 'proposal'] },
      ],
    },
    timeline: [
      { color: '#57534e', text: 'Proposal sent to Sir Ricky via email', time: 'Feb 22 - Gee' },
      { color: '#d97706', text: 'Demo completed, client rated 9/10', time: 'Feb 22 - Gee' },
      { color: '#7c3aed', text: 'Assessment complete with Raven and Ian', time: 'Feb 18 - Gee' },
      { color: '#2563eb', text: 'Discovery call with Sir Ricky', time: 'Feb 14 - Gee' },
      { color: '#94a3b8', text: 'Lead captured from inbound inquiry', time: 'Feb 14 - Auto' },
    ],
  },
  {
    id: 2, brand: 'Mlhuillier', name: 'KP Division App', project: 'KP Deal', category: 'Inbound', stage: 'asm', size: 800_000, industry: 'Financial Services', services: ['The Agency'], am: 'Gee', dateCaptured: 'Feb 20, 2026', lastActivity: '3d ago', daysInStage: 9, notes: { disc: [], asm: [], prop: [] }, timeline: [
      { color: '#7c3aed', text: 'Assessment started', time: 'Feb 22 - Gee' },
      { color: '#2563eb', text: 'Discovery call completed', time: 'Feb 20 - Gee' },
    ],
  },
  {
    id: 3, brand: 'RCBC', name: 'Digital Banking Platform', project: 'RCBC Digital', category: 'Outbound', stage: 'won', size: 3_200_000, industry: 'Banking', services: ['The Agency', 'Consulting'], am: 'Mary', dateCaptured: 'Jan 5, 2026', lastActivity: 'Yesterday', daysInStage: 0, notes: { disc: [], asm: [], prop: [] }, timeline: [
      { color: '#16a34a', text: 'Deal closed, contract signed', time: 'Mar 18 - Mary' },
      { color: '#d97706', text: 'Final proposal approved', time: 'Mar 10 - Mary' },
    ],
  },
  {
    id: 4, brand: 'NCC', name: 'App Development', project: 'NCC App', category: 'Inbound', stage: 'disc', size: 1_800_000, industry: 'Government', services: ['The Agency', 'Staff Aug'], am: 'Lyra', dateCaptured: 'Mar 1, 2026', lastActivity: '1d ago', daysInStage: 12, notes: { disc: [], asm: [], prop: [] }, timeline: [
      { color: '#2563eb', text: 'Discovery call scheduled', time: 'Mar 2 - Lyra' },
      { color: '#94a3b8', text: 'Lead captured from referral', time: 'Mar 1 - Auto' },
    ],
  },
  {
    id: 5, brand: 'PenBrothers', name: 'Staff Augmentation', project: 'PenBrothers Staff Aug', category: 'Inbound', stage: 'lead', size: 600_000, industry: 'HR / Outsourcing', services: ['Staff Aug'], am: 'Vince', dateCaptured: 'Mar 18, 2026', lastActivity: '3d ago', daysInStage: 4, notes: { disc: [], asm: [], prop: [] }, timeline: [
      { color: '#94a3b8', text: 'Lead captured via website form', time: 'Mar 18 - Auto' },
    ],
  },
  {
    id: 6, brand: 'Jollibee', name: 'Delivery Platform v2', project: 'JFC Delivery', category: 'Outbound', stage: 'disc', size: 5_500_000, industry: 'F&B / Enterprise', services: ['The Agency', 'Consulting'], am: 'Gee', dateCaptured: 'Feb 28, 2026', lastActivity: '4h ago', daysInStage: 8, notes: { disc: [], asm: [], prop: [] }, timeline: [
      { color: '#2563eb', text: 'Discovery in progress', time: 'Mar 4 - Gee' },
      { color: '#94a3b8', text: 'Lead captured from outbound outreach', time: 'Feb 28 - Auto' },
    ],
  },
]

export const DASHBOARD_METRICS = {
  totalPipeline: { value: '18.4M', trend: '+23%', trendUp: true, label: 'Total Pipeline' },
  activeDeals: { value: '12', trend: '+3 this month', trendUp: true, label: 'Active Deals' },
  winRate: { value: '68%', trend: '+5% vs last quarter', trendUp: true, label: 'Win Rate' },
  avgDealSize: { value: '1.5M', trend: '-8% vs last quarter', trendUp: false, label: 'Avg Deal Size' },
}

export const AM_LEADERBOARD = [
  { name: 'Gee', deals: '5 deals', value: '\u20B18.2M' },
  { name: 'Mary', deals: '4 deals', value: '\u20B15.7M' },
  { name: 'Lyra', deals: '2 deals', value: '\u20B13.1M' },
  { name: 'Vince', deals: '1 deal', value: '\u20B11.4M' },
]

export const RECENT_ACTIVITY = [
  { color: '#d97706', text: 'Mlhuillier Asys Deal moved to Demo+Proposal', time: '2h ago - Gee' },
  { color: '#16a34a', text: 'RCBC Digital Banking won at P3.2M', time: 'Yesterday - Mary' },
  { color: '#2563eb', text: 'Discovery notes added for NCC App', time: 'Yesterday - Lyra' },
  { color: '#7c3aed', text: 'Proposal link updated for Mlhuillier KP', time: '2d ago - Gee' },
  { color: '#94a3b8', text: 'PenBrothers lead captured via website', time: '3d ago - Auto' },
]
