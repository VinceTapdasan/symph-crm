import { type StageId, getStage } from '@/lib/constants'

const STAGE_STYLES: Record<StageId, { bg: string; color: string }> = {
  lead:  { bg: '#f1f5f9', color: '#475569' },
  disc:  { bg: 'rgba(37,99,235,0.08)',   color: '#2563eb' },
  asm:   { bg: 'rgba(124,58,237,0.08)',  color: '#7c3aed' },
  prop:  { bg: 'rgba(217,119,6,0.08)',   color: '#d97706' },
  fup:   { bg: 'rgba(245,158,11,0.08)',  color: '#92400e' },
  won:   { bg: 'rgba(22,163,74,0.08)',   color: '#16a34a' },
  lost:  { bg: 'rgba(220,38,38,0.08)',   color: '#dc2626' },
}

type BadgeProps = {
  stageId: StageId
}

export function Badge({ stageId }: BadgeProps) {
  const stage = getStage(stageId)
  const { bg, color } = STAGE_STYLES[stageId]

  return (
    <span
      className="inline-block px-2 py-px rounded-full text-xxs font-semibold leading-[18px] whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {stage.label}
    </span>
  )
}
