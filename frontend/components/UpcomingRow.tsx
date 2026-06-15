import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { MatchEvent } from '@/lib/types'

interface Props {
  event: MatchEvent
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  const hours = d.getHours()

  return {
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    badge: isToday
      ? (hours >= 20 ? 'LATE' : 'TODAY')
      : isTomorrow
      ? 'TOMORROW'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      <div className="flex-1">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink flex-wrap">
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0dbd0', background: '#f5f0e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlagImg country={event.home_team} width={32} />
          </div>
          <span>{event.home_team}</span>
          <span className="text-[#ccc] font-normal">vs</span>
          <span>{event.away_team}</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0dbd0', background: '#f5f0e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlagImg country={event.away_team} width={32} />
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
