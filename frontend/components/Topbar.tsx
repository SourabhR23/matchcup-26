'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'OVERVIEW' },
  { href: '/matches', label: 'MATCHES' },
  { href: '/groups', label: 'STANDINGS' },
]

export default function Topbar() {
  const pathname = usePathname()

  return (
    <header
      style={{ height: 'var(--topbar-height)' }}
      className="bg-ink flex items-center justify-between px-5 sticky top-0 z-50"
    >
      <Link href="/" className="font-display text-bg text-base sm:text-xl tracking-[2px] sm:tracking-[4px] hover:text-accent transition-colors flex-shrink-0">
        MATCHDAY
      </Link>

      <nav className="flex">
        {NAV.map((item, i) => {
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'text-[9px] sm:text-[10px] px-[8px] sm:px-[14px] py-[7px] tracking-[1px] sm:tracking-[1.5px] font-body transition-colors',
                i < NAV.length - 1 ? 'border-r border-r-[#222]' : '',
                active ? 'text-accent' : 'text-[#555] hover:text-accent',
              ].join(' ')}
              style={active
                ? { boxShadow: 'inset 0 -2px 0 var(--color-accent)' }
                : { boxShadow: 'inset 0 -2px 0 transparent' }
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2 flex-shrink-0">
        <span className="live-dot text-danger" />
        <span className="text-[7px] sm:text-[10px] text-[#444] tracking-[0.5px] sm:tracking-[1px] leading-none">WC 2026</span>
      </div>
    </header>
  )
}
