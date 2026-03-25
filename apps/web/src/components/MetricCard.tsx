'use client'

type MetricCardProps = {
  label: string
  value: string
  trend: string
  trendUp: boolean
  accentColor?: string
}

export function MetricCard({ label, value, trend, trendUp, accentColor }: MetricCardProps) {
  return (
    <div className="bg-white border border-black/[.06] rounded-[10px] px-5 py-[18px] shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-2">
        {label}
      </div>
      <div
        className="text-[26px] font-bold leading-none tracking-tight"
        style={{ color: accentColor || '#0f172a' }}
      >
        {value.startsWith('-') ? (
          <span className="tabular-nums">{value}</span>
        ) : (
          <>
            {/* Peso sign in a separate span without tabular-nums so it renders
                in the app's main font (Inter) rather than a system fallback */}
            <span className="text-[20px]">₱</span>
            <span className="tabular-nums">{value}</span>
          </>
        )}
      </div>
      <div className={`text-[11px] font-medium mt-2 ${trendUp ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
        {trend}
      </div>
    </div>
  )
}
