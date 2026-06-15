'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getAbbrev } from '@/lib/flags'

interface LiveEvent {
  id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  current_minute: number | null
  period: string
  status: string
}

function periodLabel(ev: LiveEvent): string {
  const p = ev.period ?? ev.status ?? ''
  if (p.includes('1') || p === '1T' || p === '1st_half') return `${ev.current_minute ?? '?'}'`
  if (p.includes('2') || p === '2T' || p === '2nd_half') return `${ev.current_minute ?? '?'}'`
  if (p === 'half_time' || p === 'HT') return 'HT'
  if (p === 'extra_time') return `ET ${ev.current_minute ?? '?'}'`
  return ev.current_minute ? `${ev.current_minute}'` : 'LIVE'
}

export default function LiveTicker() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [visible, setVisible] = useState(false)

  const fetchLive = useCallback(async () => {
    try {
      const r = await fetch('/api/live', { cache: 'no-store' })
      const data = await r.json() as { count: number; events: LiveEvent[] }
      const liveEvents = data.events ?? []
      setEvents(liveEvents)
      setVisible(liveEvents.length > 0)
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [fetchLive])

  if (!visible || events.length === 0) return null

  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: 'var(--color-danger)', padding: '6px 20px' }}
    >
      <div className="flex gap-4 overflow-x-auto scrollbar-none items-center">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/matches/${ev.id}`}
            className="flex items-center gap-2 whitespace-nowrap text-white hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ borderRight: '0.5px solid rgba(255,255,255,0.2)', paddingRight: 16 }}
          >
            <span className="live-dot text-white" />
            <span className="text-[11px] font-medium tracking-[0.5px]">
              {getAbbrev(ev.home_team)} {ev.home_score}–{ev.away_score} {getAbbrev(ev.away_team)}
            </span>
            <span className="text-[10px] text-[rgba(255,255,255,0.7)]">
              · {periodLabel(ev)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
