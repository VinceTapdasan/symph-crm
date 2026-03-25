'use client'

import { Avatar } from './Avatar'

type AMEntry = {
  name: string
  deals: string
  value: string
}

type AMLeaderboardProps = {
  entries: AMEntry[]
}

export function AMLeaderboard({ entries }: AMLeaderboardProps) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-slate-900 mb-3.5">AM Leaderboard</div>

      <div className="flex flex-col gap-1">
        {entries.map((entry, i) => (
          <div
            key={entry.name}
            className="grid grid-cols-[20px_26px_1fr_auto] items-center gap-2.5 py-2 px-1 rounded"
          >
            <div className={`text-[11px] font-bold font-mono tabular-nums text-center ${i === 0 ? 'text-[#6c63ff]' : 'text-slate-400'}`}>
              {i + 1}
            </div>
            <Avatar name={entry.name} size={26} />
            <div>
              <div className="text-xs font-semibold text-slate-900">{entry.name}</div>
              <div className="text-[10px] text-slate-400">{entry.deals}</div>
            </div>
            <div className="text-xs font-semibold text-slate-900 tabular-nums">{entry.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
