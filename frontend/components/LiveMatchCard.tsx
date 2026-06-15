import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { MatchEvent } from '@/lib/types'

interface Props {
  event: MatchEvent
  showDate?: boolean
}

function formatMatchTime(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

export default function LiveMatchCard({ event, showDate = false }: Props) {
  const isLive = event.status === 'live'
  const isFinished = event.status === 'finished'
  const isHT = event.period === 'HT'
  const { date, time } = formatMatchTime(event.event_date)

  const homeXg = event.actual_home_xg ?? event.home_xg_live
  const awayXg = event.actual_away_xg ?? event.away_xg_live
  const venueCity = event.venue?.city

  const inner = (
    <div className="match-card h-full flex flex-col gap-3" style={{ minHeight: 140 }}>
      {/* ── Top row: group badge + status ── */}
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-[#777] tracking-[2px] uppercase">
          {event.group_name || event.round_name || 'FIFA WC 2026'}
          {(isLive && event.current_minute) ? ` · ${event.current_minute}'` : ''}
          {isHT ? ' · HT' : ''}
        </span>
        {isLive ? (
          <span className="pill-live flex items-center gap-1">
            <span className="live-dot" /> LIVE
          </span>
        ) : isHT ? (
          <span
            className="text-[9px] tracking-[1.5px] px-2 py-1"
            style={{ background: '#333', color: '#999' }}
          >
            HT
          </span>
        ) : isFinished ? (
          <span className="pill-finished">FT</span>
        ) : (
          <span className="text-[10px] text-[#777]">{showDate ? date : time}</span>
        )}
      </div>

      {/* ── Score row ── */}
      <div className="flex items-center justify-between flex-1">
        {/* Home */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="mb-1.5">
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlagImg country={event.home_team} width={46} />
            </div>
          </div>
          <div
            className="font-display text-bg leading-none tracking-[1px]"
            style={{ fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {event.home_team.toUpperCase()}
          </div>
        </div>

        {/* Score / VS */}
        <div className="text-center px-3" style={{ flexShrink: 0 }}>
          {isFinished || isLive || isHT ? (
            <div
              className="font-display leading-none"
              style={{ fontSize: 44, color: 'var(--color-accent)' }}
            >
              {event.home_score ?? 0}–{event.away_score ?? 0}
            </div>
          ) : (
            <>
              <div className="font-display text-[#333]" style={{ fontSize: 20 }}>VS</div>
              <div className="font-display" style={{ fontSize: 24, color: 'var(--color-accent)' }}>{time}</div>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 text-right" style={{ minWidth: 0 }}>
          <div className="mb-1.5 flex justify-end">
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlagImg country={event.away_team} width={46} />
            </div>
          </div>
          <div
            className="font-display text-bg leading-none tracking-[1px]"
            style={{ fontSize: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {event.away_team.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Footer: xG + venue + date ── */}
      <div
        className="flex justify-between items-center pt-2 text-[10px] text-[#777]"
        style={{ borderTop: '0.5px solid #222' }}
      >
        {homeXg !== null && awayXg !== null ? (
          <span>xG {homeXg.toFixed(2)} – {awayXg.toFixed(2)}</span>
        ) : (
          <span>{date} · {time}</span>
        )}
        <span>{venueCity ?? ''}</span>
      </div>
    </div>
  )

  const href = isFinished ? `/matches/${event.id}` : undefined
  if (href) {
    return <Link href={href} className="block h-full">{inner}</Link>
  }
  return inner
}
