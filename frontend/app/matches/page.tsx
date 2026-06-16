'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/FlagImg'

interface MatchRow {
  id: number
  home_team: string
  away_team: string
  home_team_id: number
  away_team_id: number
  event_date: string
  status: string
  home_score: number | null
  away_score: number | null
  home_score_ht: number | null
  away_score_ht: number | null
  group_name: string
  round_name: string
  round_number: number
  current_minute?: number | null
  period?: string | null
  referee: { name: string } | null
  venue: { name?: string; city: string } | null
}

const STAGES = [
  { key: 'all',   label: 'ALL' },
  { key: 'group', label: 'GROUP STAGE' },
  { key: 'r32',   label: 'ROUND OF 32' },
  { key: 'r16',   label: 'ROUND OF 16' },
  { key: 'qf',    label: 'QUARTERFINAL' },
  { key: 'sf',    label: 'SEMIFINAL' },
  { key: 'final', label: 'FINAL' },
]

const STATUS_FILTERS = [
  { key: 'all',      label: 'ALL' },
  { key: 'live',     label: 'LIVE' },
  { key: 'finished', label: 'FINISHED' },
  { key: 'upcoming', label: 'UPCOMING' },
]

function stageKey(ev: MatchRow): string {
  const rn = (ev.round_name || '').toLowerCase()
  const g  = (ev.group_name  || '').toLowerCase()
  if (g.startsWith('group')) return 'group'
  if (rn.includes('round of 32') || ev.round_number === 2) return 'r32'
  if (rn.includes('round of 16') || rn.includes('r16') || ev.round_number === 3) return 'r16'
  if (rn.includes('quarter')     || ev.round_number === 4) return 'qf'
  if (rn.includes('semi')        || ev.round_number === 5) return 'sf'
  if (rn.includes('final')       || ev.round_number >= 6) return 'final'
  return 'group'
}

function statusKey(ev: MatchRow): 'live' | 'finished' | 'upcoming' {
  if (ev.status === 'inprogress' || ev.status === 'live') return 'live'
  if (ev.status === 'finished') return 'finished'
  return 'upcoming'
}

/* Bracket placeholder codes like "2A", "G1", "3A/3B/3C/3D/3F" — not real teams yet */
const PLACEHOLDER_RE = /^([A-Z]\d|\d[A-Z])(\/\d[A-Z])*$/
function isPlaceholderTeam(name: string): boolean {
  return PLACEHOLDER_RE.test((name || '').trim())
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  })
}

function liveMinuteLabel(ev: MatchRow): string {
  const p = ev.period ?? ''
  if (p === 'half_time' || p === 'HT') return 'HT'
  if (p === 'extra_time') return `ET ${ev.current_minute ?? '?'}'`
  if (p === 'penalty_shootout') return 'PSO'
  return ev.current_minute ? `${ev.current_minute}'` : 'LIVE'
}

/* ─── Team Badge ──────────────────────────────────────────── */
function TeamBadge({ country, dark = true }: { country: string; dark?: boolean }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%',
      border: dark ? '1.5px solid #2a2a2a' : '1.5px solid #e0dbd0',
      background: dark ? '#0d0d0d' : '#f5f0e8',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <FlagImg country={country} width={48} />
    </div>
  )
}

/* ─── Card: Completed ─────────────────────────────────────── */
function CompletedCard({ ev }: { ev: MatchRow }) {
  const date = new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return (
    <Link href={`/matches/${ev.id}`} className="match-card block hover:opacity-90 transition-opacity">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-[#777] tracking-[1.5px]">
          {ev.group_name || ev.round_name || 'GROUP STAGE'}
        </span>
        <span className="pill-finished">FT</span>
      </div>

      <div className="flex items-center justify-between">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2.5">
          <TeamBadge country={ev.home_team} dark />
          <div className="font-display text-bg tracking-[1px]" style={{ fontSize: 19 }}>{ev.home_team.toUpperCase()}</div>
        </div>

        {/* Score */}
        <div className="text-center px-3">
          <div className="font-display leading-none" style={{ fontSize: 40, color: 'var(--color-accent)' }}>
            {ev.home_score}–{ev.away_score}
          </div>
          {ev.home_score_ht !== null && (
            <div className="text-[10px] text-[#777] mt-0.5">HT: {ev.home_score_ht}–{ev.away_score_ht}</div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center justify-end gap-2.5">
          <div className="font-display text-bg tracking-[1px] text-right" style={{ fontSize: 19 }}>{ev.away_team.toUpperCase()}</div>
          <TeamBadge country={ev.away_team} dark />
        </div>
      </div>

      <div className="flex justify-between mt-2 pt-2 text-[10px] text-[#777]" style={{ borderTop: '0.5px solid #222' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{ev.referee?.name ?? date}</span>
        <span style={{ flexShrink: 0, marginLeft: 6 }}>{ev.venue?.city ?? '—'}</span>
      </div>
    </Link>
  )
}

/* ─── Card: Live ──────────────────────────────────────────── */
function LiveCard({ ev }: { ev: MatchRow }) {
  const label = liveMinuteLabel(ev)
  const isHT  = ev.period === 'half_time' || ev.period === 'HT'

  return (
    <Link href={`/matches/${ev.id}`} className="match-card block hover:opacity-90 transition-opacity" style={{ borderColor: 'var(--color-danger)' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-[#777] tracking-[1.5px]">
          {ev.group_name || ev.round_name || 'GROUP STAGE'}
        </span>
        {isHT ? (
          <span className="text-[9px] font-bold tracking-[1px] px-2 py-0.5" style={{ background: '#333', color: '#aaa' }}>HT</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[1px] px-2 py-0.5" style={{ background: 'var(--color-danger)', color: '#fff' }}>
            <span className="live-dot" />{label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2.5">
          <TeamBadge country={ev.home_team} dark />
          <div className="font-display text-bg tracking-[1px]" style={{ fontSize: 19 }}>{ev.home_team.toUpperCase()}</div>
        </div>

        {/* Score */}
        <div className="text-center px-3">
          <div className="font-display leading-none" style={{ fontSize: 40, color: 'var(--color-accent)' }}>
            {ev.home_score ?? 0}–{ev.away_score ?? 0}
          </div>
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center justify-end gap-2.5">
          <div className="font-display text-bg tracking-[1px] text-right" style={{ fontSize: 19 }}>{ev.away_team.toUpperCase()}</div>
          <TeamBadge country={ev.away_team} dark />
        </div>
      </div>

      <div className="flex justify-between mt-2 pt-2 text-[10px] text-[#777]" style={{ borderTop: '0.5px solid #222' }}>
        <span style={{ color: 'var(--color-danger)' }}>Live updates every 30s →</span>
        <span style={{ flexShrink: 0, marginLeft: 6 }}>{ev.venue?.city ?? '—'}</span>
      </div>
    </Link>
  )
}

/* ─── Card: Upcoming ──────────────────────────────────────── */
function UpcomingCard({ ev }: { ev: MatchRow }) {
  const time = formatTime(ev.event_date)
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e8e2d8] hover:border-[#111] transition-colors">
      {/* Home */}
      <div className="flex items-center gap-2.5 flex-1">
        <TeamBadge country={ev.home_team} dark={false} />
        <div className="font-display tracking-[1px] text-ink" style={{ fontSize: 17 }}>{ev.home_team.toUpperCase()}</div>
      </div>

      {/* Center */}
      <div className="text-center flex-shrink-0 min-w-[90px]">
        <div className="font-display text-ink" style={{ fontSize: 22, letterSpacing: 1 }}>{time}</div>
        <div className="text-[9px] text-[#999] tracking-[1px] mt-0.5">
          {ev.group_name || ev.round_name}
        </div>
        {ev.venue?.city && (
          <div className="text-[9px] text-[#bbb] mt-0.5">{ev.venue.city}</div>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center justify-end gap-2.5 flex-1">
        <div className="font-display tracking-[1px] text-ink text-right" style={{ fontSize: 17 }}>{ev.away_team.toUpperCase()}</div>
        <TeamBadge country={ev.away_team} dark={false} />
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function MatchesPage() {
  const [events,       setEvents]       = useState<MatchRow[]>([])
  const [liveMap,      setLiveMap]      = useState<Record<number, MatchRow>>({})
  const [stageFilter,  setStageFilter]  = useState('all')
  const [statusFilter, setStatusFilter] = useState('upcoming')
  const [teamFilter,   setTeamFilter]   = useState('all')
  const [loading,      setLoading]      = useState(true)
  const [scrolledToToday, setScrolledToToday] = useState(false)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data: MatchRow[]) => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fetchLive = useCallback(async () => {
    try {
      const r    = await fetch('/api/live', { cache: 'no-store' })
      const data = await r.json() as { events?: MatchRow[] }
      const map: Record<number, MatchRow> = {}
      for (const ev of (data.events ?? [])) map[ev.id] = ev
      setLiveMap(map)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchLive()
    const iv = setInterval(fetchLive, 30000)
    return () => clearInterval(iv)
  }, [fetchLive])

  const merged: MatchRow[] = events.map((ev) => {
    const live = liveMap[ev.id]
    if (!live) return ev
    return { ...ev, status: live.status, home_score: live.home_score, away_score: live.away_score, current_minute: live.current_minute, period: live.period }
  })
  for (const live of Object.values(liveMap)) {
    if (!merged.find((e) => e.id === live.id)) merged.push(live)
  }

  // Hide unresolved bracket placeholder matches (e.g. "2A vs 1C") until real teams are assigned
  const resolved = merged.filter((e) => !isPlaceholderTeam(e.home_team) && !isPlaceholderTeam(e.away_team))

  // Apply stage filter, then status filter, then team filter
  const stageFiltered  = stageFilter  === 'all' ? resolved       : resolved.filter((e) => stageKey(e)  === stageFilter)
  const statusFiltered = statusFilter === 'all' ? stageFiltered  : stageFiltered.filter((e) => statusKey(e) === statusFilter)
  const teamFiltered    = teamFilter   === 'all' ? statusFiltered : statusFiltered.filter((e) => e.home_team === teamFilter || e.away_team === teamFilter)

  const sorted = [...teamFiltered].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )

  const teamOptions = Array.from(new Set(events.flatMap((e) => [e.home_team, e.away_team])))
    .filter((t) => !isPlaceholderTeam(t))
    .sort()

  // Group by UTC calendar date (ISO "YYYY-MM-DD") — avoids local-timezone date shifting
  const byDate: Record<string, MatchRow[]> = {}
  for (const ev of sorted) {
    const dk = new Date(ev.event_date).toISOString().slice(0, 10)
    if (!byDate[dk]) byDate[dk] = []
    byDate[dk].push(ev)
  }
  const dates = Object.keys(byDate).sort()

  const liveCount = Object.keys(liveMap).length

  useEffect(() => {
    if (scrolledToToday || loading || dates.length === 0) return
    const todayStr = new Date().toISOString().slice(0, 10)
    const targetKey = dates.find((d) => d === todayStr)
      ?? dates.find((d) => d >= todayStr)
      ?? dates[dates.length - 1]
    const el = document.getElementById(`date-${targetKey}`)
    if (el) el.scrollIntoView({ block: 'start' })
    setScrolledToToday(true)
  }, [loading, dates, scrolledToToday])

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="sec-head mb-0">ALL MATCHES</div>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[1px] px-2 py-1"
            style={{ background: 'var(--color-danger)', color: '#fff' }}>
            <span className="live-dot" />{liveCount} LIVE
          </span>
        )}
      </div>

      {/* Status pills — ALL / LIVE / FINISHED / UPCOMING */}
      <div className="flex gap-1.5 mb-3">
        {STATUS_FILTERS.map((s) => {
          const isLivePill = s.key === 'live'
          const isActive   = statusFilter === s.key
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              style={{
                fontSize: 10, padding: '5px 14px', letterSpacing: 1,
                cursor: 'pointer', fontFamily: 'var(--font-inter)',
                border: isActive
                  ? (isLivePill ? '0.5px solid var(--color-danger)' : '0.5px solid #111')
                  : '0.5px solid #ccc',
                background: isActive
                  ? (isLivePill ? 'var(--color-danger)' : '#111')
                  : 'var(--color-surface)',
                color: isActive ? (isLivePill ? '#fff' : 'var(--color-accent)') : '#555',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              {isLivePill && isActive && <span className="live-dot" />}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Stage filter bar */}
      <div className="flex gap-1.5 flex-wrap items-center mb-5">
        {STAGES.map((s) => (
          <button
            key={s.key}
            className={`filter-btn ${stageFilter === s.key ? 'active' : ''}`}
            onClick={() => setStageFilter(s.key)}
          >
            {s.label}
          </button>
        ))}

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          style={{
            fontSize: 10, padding: '5px 10px', letterSpacing: 1,
            border: teamFilter !== 'all' ? '0.5px solid #111' : '0.5px solid #ccc',
            background: 'var(--color-surface)',
            color: teamFilter !== 'all' ? 'var(--color-accent)' : '#555',
            fontFamily: 'var(--font-inter)', cursor: 'pointer',
          }}
        >
          <option value="all">ALL TEAMS</option>
          {teamOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-ink-faint text-sm py-8 text-center tracking-[1px]">Loading matches…</div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="text-ink-faint text-sm py-8 text-center">No matches for this filter.</div>
      )}

      {dates.map((dk) => {
        const dayEvents = byDate[dk]
        const label = new Date(dk).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
        })
        const liveInDay      = dayEvents.filter((e) => e.status === 'inprogress' || e.status === 'live')
        const completedInDay = dayEvents.filter((e) => e.status === 'finished')
        const upcomingInDay  = dayEvents.filter((e) => e.status === 'notstarted' || e.status === 'scheduled')

        return (
          <div key={dk} id={`date-${dk}`} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display text-[16px] tracking-[2px] text-ink-faint">
                {label.toUpperCase()}
              </span>
              <div className="flex-1 h-px bg-[#ddd8cc]" />
              <span className="text-[10px] text-ink-faint">
                {dayEvents.length} match{dayEvents.length > 1 ? 'es' : ''}
              </span>
            </div>

            {liveInDay.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                {liveInDay.map((ev) => <LiveCard key={ev.id} ev={ev} />)}
              </div>
            )}

            {completedInDay.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                {completedInDay.map((ev) => <CompletedCard key={ev.id} ev={ev} />)}
              </div>
            )}

            {upcomingInDay.length > 0 && (
              <div className="flex flex-col border border-[#e8e2d8] overflow-hidden divide-y divide-[#e8e2d8]">
                {upcomingInDay.map((ev) => <UpcomingCard key={ev.id} ev={ev} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
