'use client'

import { STAGES, DEALS } from '@/lib/constants'
import { Avatar } from './Avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function Reports() {
  const stageData = STAGES.map(s => ({
    ...s,
    count: DEALS.filter(d => d.stage === s.id).length,
    value: DEALS.filter(d => d.stage === s.id).reduce((a, d) => a + d.size, 0),
  }))
  const maxVal = Math.max(...stageData.map(s => s.value), 1)

  const funnelData = [
    { label: 'Lead Captured', count: 12, color: '#94a3b8', width: 100 },
    { label: 'Discovery', count: 8, color: '#2563eb', width: 67 },
    { label: 'Assessment', count: 5, color: '#0369a1', width: 42 },
    { label: 'Demo + Proposal', count: 3, color: '#d97706', width: 25 },
    { label: 'Follow-up', count: 2, color: '#f59e0b', width: 17 },
    { label: 'Won', count: 3, color: '#16a34a', width: 25 },
  ]

  const amData = [
    { name: 'Gee', deals: 5, value: '\u20B18.2M', winRate: '68%' },
    { name: 'Mary', deals: 4, value: '\u20B15.7M', winRate: '75%' },
    { name: 'Lyra', deals: 2, value: '\u20B13.1M', winRate: '50%' },
    { name: 'Vince', deals: 1, value: '\u20B11.4M', winRate: '100%' },
  ]

  const servicesData = [
    { label: 'The Agency', count: 8, color: '#18181b' },
    { label: 'Consulting', count: 5, color: '#2563eb' },
    { label: 'Staff Augmentation', count: 3, color: '#0369a1' },
    { label: 'Other Products', count: 2, color: '#d97706' },
  ]

  const metrics = [
    { label: 'Total Closed Won', value: '\u20B14.8M', trend: 'Q1 2026', color: '#16a34a' },
    { label: 'Deals Won', value: '3', trend: 'Q1 2026', color: undefined },
    { label: 'Deals Lost', value: '1', trend: '1 this quarter', color: '#dc2626' },
    { label: 'Avg Sales Cycle', value: '34d', trend: '-5d vs last quarter', color: undefined },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1200px]">
      {/* Metrics row */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {metrics.map((m) => (
          <Card key={m.label} className="flex-[1_1_200px]">
            <CardContent>
              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">{m.label}</div>
              <div className="text-[22px] font-bold tabular-nums leading-none" style={{ color: m.color || undefined }}>
                {!m.color && <span className="text-text-primary">{m.value}</span>}
                {m.color && m.value}
              </div>
              <div className="text-[11px] text-text-tertiary mt-1.5">{m.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Pipeline Value by Stage */}
        <Card>
          <CardContent>
            <div className="text-[13px] font-semibold text-text-primary mb-4">
              Pipeline Value by Stage
            </div>
            <div className="flex flex-col gap-2.5">
              {stageData.filter(s => s.value > 0).map((s) => (
                <div key={s.id} className="grid grid-cols-[100px_1fr_60px] items-center gap-3">
                  <div className="text-xs font-medium text-text-secondary text-right">{s.label}</div>
                  <div className="h-5 bg-surface-2 rounded-[--radius-sm] overflow-hidden">
                    <div
                      className="h-full rounded-[--radius-sm] opacity-85 transition-all"
                      style={{ width: `${Math.max(2, Math.round((s.value / maxVal) * 100))}%`, background: s.color }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-text-primary tabular-nums">
                    {s.value >= 1_000_000 ? `${(s.value / 1_000_000).toFixed(1)}M` : s.value >= 1_000 ? `${Math.round(s.value / 1_000)}K` : s.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <CardContent>
            <div className="text-[13px] font-semibold text-text-primary mb-4">
              Pipeline Funnel
            </div>
            <div className="flex flex-col gap-1.5 items-center">
              {funnelData.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5 w-full"
                >
                  <div className="text-[11px] font-medium text-text-secondary w-[110px] text-right shrink-0">{f.label}</div>
                  <div
                    className="h-[26px] rounded flex items-center justify-center text-[11px] font-bold text-white font-mono opacity-85 transition-all"
                    style={{ width: `${f.width}%`, minWidth: 40, background: f.color }}
                  >
                    {f.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AM Performance table */}
      <Card className="mb-4">
        <CardContent>
          <div className="text-[13px] font-semibold text-text-primary mb-3.5">
            AM Performance
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {['Account Manager', 'Active Deals', 'Pipeline Value', 'Win Rate', 'Last Activity'].map(h => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {amData.map(am => (
                <TableRow key={am.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={am.name} size={22} />
                      <span className="text-xs font-semibold text-text-primary">{am.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary font-mono tabular-nums">{am.deals}</TableCell>
                  <TableCell className="text-xs font-semibold text-accent tabular-nums">{am.value}</TableCell>
                  <TableCell className="text-xs font-semibold text-[#16a34a] font-mono tabular-nums">{am.winRate}</TableCell>
                  <TableCell className="text-xs text-text-tertiary">Today</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Services Breakdown */}
      <Card>
        <CardContent>
          <div className="text-[13px] font-semibold text-text-primary mb-4">
            Services Breakdown
          </div>
          <div className="flex flex-col gap-2.5">
            {servicesData.map((s) => (
              <div key={s.label} className="grid grid-cols-[140px_1fr_60px] items-center gap-3">
                <div className="text-xs font-medium text-text-secondary text-right">{s.label}</div>
                <div className="h-5 bg-surface-2 rounded-[--radius-sm] overflow-hidden">
                  <div
                    className="h-full rounded-[--radius-sm] opacity-85"
                    style={{ width: `${(s.count / 8) * 100}%`, background: s.color }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-text-primary font-mono">{s.count} deals</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
