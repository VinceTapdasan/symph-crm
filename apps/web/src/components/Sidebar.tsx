'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  path: string
  label: string
  badge?: number
  badgeColor?: string
  icon: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { path: '/', label: 'Dashboard', icon: 'M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z' },
      { path: '/pipeline', label: 'Pipeline', badge: 12, badgeColor: '#6c63ff', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
      { path: '/inbox', label: 'Inbox', badge: 5, badgeColor: '#dc2626', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { path: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { path: '/proposals', label: 'Proposal Builder', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { path: '/chat', label: 'Chat', icon: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' },
    ],
  },
]

function NavIcon({ path }: { path: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function isActive(itemPath: string, pathname: string): boolean {
  if (itemPath === '/') return pathname === '/'
  return pathname === itemPath || pathname.startsWith(itemPath + '/')
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'w-[216px] shrink-0 bg-white border-r border-black/[.06] flex flex-col h-full',
        'fixed inset-y-0 left-0 z-30 md:relative md:z-auto',
        'transition-transform duration-150',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className="px-4 pt-[18px] pb-[14px] border-b border-black/[.06] flex items-center gap-[10px]">
          <div
            className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[13px] font-extrabold text-white shrink-0 tracking-tight"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)' }}
          >
            S
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-900 tracking-[-0.02em]">Symph CRM</div>
            <div className="text-[10px] text-slate-400">Sales Pipeline</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 py-2 flex-1 flex flex-col overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={cn(si > 0 && 'mt-3')}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 px-[10px] pt-[6px] pb-1">
                {section.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map(item => {
                  const active = isActive(item.path, pathname)
                  const hovered = hoveredPath === item.path
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => onClose?.()}
                      onMouseEnter={() => setHoveredPath(item.path)}
                      onMouseLeave={() => setHoveredPath(null)}
                      className={cn(
                        'flex items-center gap-[9px] px-[10px] py-2 rounded text-[12.5px] w-full text-left transition-colors duration-150 active:scale-[0.98]',
                        active
                          ? 'border border-[rgba(108,99,255,0.15)] font-semibold'
                          : 'border border-transparent font-medium',
                        !active && hovered && 'bg-slate-100 text-slate-900',
                        !active && !hovered && 'text-slate-600',
                      )}
                      style={active ? { background: 'rgba(108,99,255,0.08)', color: '#6c63ff' } : undefined}
                    >
                      <NavIcon path={item.icon} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-white text-[10px] font-bold px-1.5 py-px rounded-full font-mono tabular-nums"
                          style={{ background: item.badgeColor || '#6c63ff' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-[14px] py-3 border-t border-black/[.06] flex items-center gap-[9px]">
          <Avatar name="Gee" size={28} />
          <div>
            <div className="text-[12px] font-semibold text-slate-900">Gee</div>
            <div className="text-[10px] text-slate-400">CRSO</div>
          </div>
        </div>
      </aside>
    </>
  )
}
