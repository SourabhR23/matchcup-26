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
      <Link href="/" className="font-display text-bg text-xl tracking-[4px] hover:text-accent transition-colors">
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
                'text-[10px] px-[14px] py-[7px] tracking-[1.5px] font-body transition-colors',
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

      <div className="flex items-center gap-2">
        <span className="live-dot text-danger" />
        <span className="text-[10px] text-[#444] tracking-[1px]">WC 2026</span>
      </div>
    </header>
  )
}
