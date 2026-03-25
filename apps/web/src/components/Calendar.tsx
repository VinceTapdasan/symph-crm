'use client'

import { useState } from 'react'
import { DEALS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type CalendarEvent = {
  day: number
  label: string
  color: string
  dealId: number
}

const EVENTS: CalendarEvent[] = [
  { day: 22, label: 'Asys Board Review', color: '#18181b', dealId: 1 },
  { day: 23, label: 'NCC Discovery 2', color: '#2563eb', dealId: 4 },
  { day: 24, label: 'Mlhuillier Follow-up', color: '#d97706', dealId: 1 },
  { day: 25, label: 'RCBC Onboarding', color: '#16a34a', dealId: 3 },
  { day: 25, label: 'KP Scope Review', color: '#0369a1', dealId: 2 },
  { day: 27, label: 'JFC Stakeholder Call', color: '#dc2626', dealId: 6 },
  { day: 28, label: 'PenBrothers Intro Call', color: '#2563eb', dealId: 5 },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarProps = {
  onOpenDeal: (id: number) => void
}

export function Calendar({ onOpenDeal }: CalendarProps) {
  const [month, setMonth] = useState(2) // March
  const [year, setYear] = useState(2026)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const getEvents = (day: number) => EVENTS.filter(e => e.day === day)

  const cells: { day: number; current: boolean; events: CalendarEvent[] }[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + i + 1, current: false, events: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, events: getEvents(d) })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, current: false, events: [] })
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Calendar grid */}
        <div>
          {/* Nav */}
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="text-base font-bold text-text-primary tracking-tight">
              {MONTHS[month]} {year}
            </div>
            <div className="ml-auto flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }}
              >
                Next
              </Button>
              <Button size="sm">
                + Event
              </Button>
            </div>
          </div>

          {/* Grid */}
          <Card className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((cell, i) => {
                const isToday = cell.current && cell.day === 22 && month === 2

                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[52px] md:min-h-[80px] px-[3px] md:px-[5px] py-1 border-t border-border',
                      (i + 1) % 7 !== 0 && 'border-r border-border',
                      isToday && 'bg-accent-dim',
                      !cell.current && 'opacity-35'
                    )}
                  >
                    <div
                      className={cn(
                        'text-[11px] font-mono tabular-nums mb-[3px]',
                        isToday ? 'font-bold text-accent' : 'font-medium text-text-secondary'
                      )}
                    >
                      {cell.day}
                    </div>
                    {cell.events.map((ev, j) => (
                      <div
                        key={j}
                        onClick={() => onOpenDeal(ev.dealId)}
                        className="text-[10px] font-medium px-[5px] py-[2px] rounded-[3px] mb-[2px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-colors"
                        style={{ background: `${ev.color}12`, color: ev.color }}
                      >
                        {ev.label}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Upcoming events sidebar */}
        <Card>
          <CardContent>
            <div className="text-[13px] font-semibold text-text-primary mb-3.5">
              Upcoming Events
            </div>
            <div className="flex flex-col">
              {EVENTS.map((ev, i) => {
                const deal = DEALS.find(d => d.id === ev.dealId)
                return (
                  <div
                    key={i}
                    onClick={() => onOpenDeal(ev.dealId)}
                    className={cn(
                      'grid grid-cols-[36px_1fr] gap-2.5 py-2.5 cursor-pointer',
                      i < EVENTS.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div className="text-center">
                      <div className="text-base font-bold font-mono tabular-nums" style={{ color: ev.color }}>{ev.day}</div>
                      <div className="text-[10px] text-text-tertiary">Mar</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: ev.color }}>{ev.label}</div>
                      <div className="text-[11px] text-text-tertiary">{deal?.brand || ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
