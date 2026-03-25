'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from './EmptyState'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarProps = {
  onOpenDeal: (id: number) => void
}

export function Calendar({ onOpenDeal: _onOpenDeal }: CalendarProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const today = now.getDate()
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()

  const cells: { day: number; current: boolean }[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + i + 1, current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, current: false })
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
                const isToday = cell.current && cell.day === today && isCurrentMonth

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
            <EmptyState
              icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              title="No upcoming events"
              description="Events linked to deals will show up here"
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
