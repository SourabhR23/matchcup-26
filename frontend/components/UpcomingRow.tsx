import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { MatchEvent } from '@/lib/types'

interface Props {
  event: MatchEvent
}

function formatTime(dateStr: string) {
  const d   = new Date(dateStr)
  const now = new Date()

  // Compare calendar dates in UTC — matches event_date convention used everywhere else in the app
  const utcDateStr = (dt: Date) => dt.toLocaleDateString('en-US', { timeZone: 'UTC' })
  const isToday     = utcDateStr(d) === utcDateStr(now)
  const isTomorrow  = utcDateStr(d) === utcDateStr(new Date(now.getTime() + 86400000))
  const utcHours    = d.getUTCHours()

  return {
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
    badge: isToday
      ? (utcHours >= 20 ? 'LATE' : 'TODAY')
      : isTomorrow
      ? 'TOMORROW'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  }
}

export default function UpcomingRow({ event }: Props) {
  const { time, badge } = formatTime(event.event_date)

  return (
    <Link
      href={`/matches/${event.id}`}
      className="flex items-center gap-4 bg-surface border-b border-[#e8e2d8] px-4 py-3 hover:bg-[#faf8f4] transition-colors"
    >
      {/* Time */}
      <span
        className="font-display text-ink min-w-[55px]"
        style={{ fontSize: 22, letterSpacing: 0.5 }}
      >
        {time}
      </span>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-[13px] font-medium text-ink">
          <div className="flex items-center gap-2 min-w-0">
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0dbd0', background: '#f5f0e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FlagImg country={event.home_team} width={32} />
            </div>
            <span className="truncate">{event.home_team}</span>
            <span className="text-[#ccc] font-normal sm:hidden flex-shrink-0">vs</span>
          </div>
          <span className="text-[#ccc] font-normal hidden sm:inline flex-shrink-0">vs</span>
          <div className="flex items-center gap-2 min-w-0">
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0dbd0', background: '#f5f0e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FlagImg country={event.away_team} width={32} />
            </div>
            <span className="truncate">{event.away_team}</span>
          </div>
        </div>
        <div className="text-[10px] text-[#999] mt-0.5 tracking-[0.5px]">
          {event.group_name || event.round_name}
          {event.venue?.city ? ` · ${event.venue.city}` : ''}
        </div>
      </div>

      {/* Badge */}
      <span
        className="text-[9px] font-bold tracking-[1px] px-2 py-1 flex-shrink-0"
        style={{ background: '#1a1a1a', color: '#777' }}
      >
        {badge}
      </span>
    </Link>
  )
}
