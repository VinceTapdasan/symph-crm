'use client'

type ActivityEntry = {
  color: string
  text: string
  time: string
}

type RecentActivityProps = {
  entries: ActivityEntry[]
}

export function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-slate-900 mb-3.5">Recent Activity</div>

      <div className="flex flex-col">
        {entries.map((entry, i) => (
          <div
            key={i}
            className={`grid grid-cols-[8px_1fr] gap-3 py-2.5 px-1 ${i < entries.length - 1 ? 'border-b border-black/[.06]' : ''}`}
          >
            <div
              className="w-2 h-2 rounded-full mt-1 shrink-0"
              style={{ background: entry.color }}
            />
            <div>
              <div className="text-xs font-medium text-slate-900 leading-[1.4]">{entry.text}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{entry.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
