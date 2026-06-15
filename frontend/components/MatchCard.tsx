import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { MatchEvent } from '@/lib/types'

interface MatchCardProps {
  event: MatchEvent
  href?: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

export default function MatchCard({ event, href }: MatchCardProps) {
  const { date, time } = formatDate(event.event_date)
  const isFinished = event.status === 'finished'
  const isLive = event.status === 'live'

  const inner = (
    <div className="match-card h-full flex flex-col">
      {/* top row: badge + meta */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[9px] text-[#777] tracking-[1.5px]">
          {event.group_name || event.round_name || 'GROUP STAGE'}
        </span>
        {isLive ? (
          <span className="pill-live flex items-center gap-1">
            <span className="live-dot" />
            LIVE {event.current_minute}&apos;
          </span>
        ) : isFinished ? (
          <span className="pill-finished">FT</span>
        ) : (
          <span className="text-[9px] text-[#777] tracking-[1px]">{date} · {time}</span>
        )}
      </div>

      {/* score row */}
      <div className="flex items-center justify-between flex-1">
        {/* home */}
        <div className="flex-1 flex flex-col items-start gap-1.5" style={{ minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlagImg country={event.home_team} width={50} />
          </div>
          <div className="font-display text-bg text-lg tracking-[1px] leading-tight" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{event.home_team}</div>
        </div>

        {/* score / vs */}
        <div
          className="font-display px-2.5 text-center min-w-[70px]"
          style={{ fontSize: 36, color: 'var(--color-accent)', lineHeight: 1, flexShrink: 0 }}
        >
          {isFinished || isLive
            ? `${event.home_score ?? 0}–${event.away_score ?? 0}`
            : 'VS'}
        </div>

        {/* away */}
        <div className="flex-1 flex flex-col items-end gap-1.5" style={{ minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlagImg country={event.away_team} width={50} />
          </div>
          <div className="font-display text-bg text-lg tracking-[1px] leading-tight text-right" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{event.away_team}</div>
        </div>
      </div>

      {/* footer */}
      <div
        className="flex justify-between mt-2.5 pt-2 text-[10px] text-[#777]"
        style={{ borderTop: '0.5px solid #222' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
          {event.referee?.name ?? date}
        </span>
        <span style={{ flexShrink: 0, marginLeft: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>
          {event.venue
            ? [event.venue.name, event.venue.city].filter(Boolean).join(' · ')
            : '—'}
        </span>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    )
  }
  return inner
}
