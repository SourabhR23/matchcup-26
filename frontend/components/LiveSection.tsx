'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/FlagImg'

interface GoalScorer {
  player:   string
  minute:   number
  is_home:  boolean
  own_goal: boolean
}

interface LiveEvent {
  id: number
  home_team: string
  away_team: string
  home_team_id: number
  away_team_id: number
  home_score: number
  away_score: number
  home_score_ht: number
  away_score_ht: number
  current_minute: number | null
  period: string
  status: string
  group_name?: string
  round_name?: string
  event_date?: string
  mins_to_kick?: number
  last_updated?: string
  goal_scorers?: GoalScorer[]
  starting_soon?: boolean
  just_finished?: boolean
}

function periodDisplay(ev: LiveEvent): string {
  const p = ev.period ?? ev.status ?? ''
  if (p === 'half_time' || p === 'HT') return 'HT'
  if (p === 'extra_time') return `ET ${ev.current_minute ?? '?'}'`
  if (p === 'penalty_shootout') return 'PSO'
  return ev.current_minute ? `${ev.current_minute}'` : 'LIVE'
}

function periodBadge(ev: LiveEvent): string {
  const p = ev.period ?? ev.status ?? ''
  if (p === 'half_time' || p === 'HT') return 'HT'
  if (p.includes('2') || p === '2T' || p === '2nd_half') return '2ND'
  if (p === 'extra_time') return 'ET'
  if (p === 'penalty_shootout') return 'PSO'
  return '1ST'
}

export default function LiveSection() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchLive = useCallback(async () => {
    try {
      const r = await fetch('/api/live', { cache: 'no-store' })
      const data = await r.json() as { count: number; events: LiveEvent[] }
      setEvents(data.events ?? [])
      setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [fetchLive])

  const liveCount = events.filter((e) => !e.starting_soon && !e.just_finished).length
  const ftCount   = events.filter((e) =>  e.just_finished).length
  const soonCount = events.filter((e) =>  e.starting_soon).length
  const anyLive   = liveCount > 0
  const anyFt     = ftCount   > 0
  const anySoon   = soonCount > 0

  /* Section title priority: live > just finished > starting soon */
  const sectionTitle = anyLive ? 'LIVE NOW' : anyFt ? 'JUST FINISHED' : 'STARTING SOON'

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-display" style={{ fontSize: 28, letterSpacing: 2, color: '#111' }}>
            LIVE NOW
          </span>
          <span className="text-[10px] text-[#999] tracking-[1px]">Checking…</span>
        </div>
      </section>
    )
  }

  if (events.length === 0) return null

  return (
    <section className="mb-8">
      {/* Section head */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display" style={{ fontSize: 28, letterSpacing: 2, color: '#111' }}>
          {sectionTitle}
        </h2>

        {/* Live badge */}
        {anyLive && (
          <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[1px] px-2 py-1"
            style={{ background: 'var(--color-danger)', color: '#fff' }}>
            <span className="live-dot" />
            {liveCount} MATCH{liveCount > 1 ? 'ES' : ''}
          </span>
        )}

        {/* Just finished badge */}
        {anyFt && (
          <span className="text-[9px] font-bold tracking-[1px] px-2 py-1"
            style={{ background: '#222', color: '#f5f0e8' }}>
            {ftCount} FULL TIME
          </span>
        )}

        {/* Starting soon badge */}
        {anySoon && (
          <span className="text-[9px] font-bold tracking-[1px] px-2 py-1"
            style={{ background: '#111', color: 'var(--color-accent)' }}>
            {soonCount} SOON
          </span>
        )}

        <span className="text-[10px] text-[#999] ml-auto">Updated {lastUpdate}</span>
      </div>

      {/* Match cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {events.map((ev) => {
          const isSoon     = ev.starting_soon === true
          const isFinished = ev.just_finished  === true
          const kickoff    = ev.event_date ? new Date(ev.event_date) : null
          const minsLeft   = ev.mins_to_kick ?? (kickoff ? Math.round((kickoff.getTime() - Date.now()) / 60000) : null)
          const kickLabel  = minsLeft != null
            ? minsLeft <= 0  ? 'KICKING OFF'
            : minsLeft === 1 ? '1 MIN'
            :                  `${minsLeft} MINS`
            : 'SOON'

          return (
            <Link key={ev.id} href={`/matches/${ev.id}`} className="match-card block">
              {/* Header row */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] text-[#444] tracking-[2px] uppercase">
                  {ev.group_name || ev.round_name || 'FIFA WC 2026'}
                </span>
                <div className="flex items-center gap-2">
                  {isSoon ? (
                    /* Starting soon chips */
                    <>
                      <span className="text-[9px] tracking-[1px] px-1.5 py-0.5"
                        style={{ background: '#222', color: '#aaa' }}>
                        KICK OFF
                      </span>
                      <span className="text-[9px] font-bold tracking-[1px] px-2 py-1"
                        style={{ background: 'var(--color-accent)', color: '#111' }}>
                        {kickLabel}
                      </span>
                    </>
                  ) : isFinished ? (
                    /* Just finished chips */
                    <>
                      <span className="text-[9px] tracking-[1px] px-1.5 py-0.5"
                        style={{ background: '#1a1a1a', color: '#555' }}>
                        FULL TIME
                      </span>
                      <span className="text-[9px] font-bold tracking-[1px] px-2 py-1"
                        style={{ background: '#f5f0e8', color: '#111' }}>
                        FT
                      </span>
                    </>
                  ) : (
                    /* Live chips */
                    <>
                      <span className="text-[9px] tracking-[1px] px-1.5 py-0.5"
                        style={{ background: '#222', color: '#777' }}>
                        {periodBadge(ev)} HALF
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold tracking-[1px] px-2 py-1"
                        style={{ background: 'var(--color-danger)', color: '#fff' }}>
                        <span className="live-dot" />
                        {periodDisplay(ev)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Score / vs row */}
              <div className="flex items-start justify-between">
                {/* Home */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FlagImg country={ev.home_team} width={42} />
                    </div>
                  </div>
                  <div className="font-display text-bg leading-none tracking-wide" style={{ fontSize: 24 }}>
                    {ev.home_team.toUpperCase()}
                  </div>
                  {(isFinished || !isSoon) && ev.goal_scorers && ev.goal_scorers.filter(g => g.is_home).length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      {ev.goal_scorers.filter(g => g.is_home).map((g, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#888', letterSpacing: 0.5 }}>
                          ⚽ {g.player}{g.own_goal ? ' (og)' : ''} {g.minute}&apos;
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center px-4 pt-1">
                  {isSoon ? (
                    <div className="font-display leading-none"
                      style={{ fontSize: 36, color: '#555', lineHeight: 1, letterSpacing: 2 }}>
                      VS
                    </div>
                  ) : (
                    <>
                      <div className="font-display leading-none"
                        style={{ fontSize: 52, color: isFinished ? '#f5f0e8' : 'var(--color-accent)', lineHeight: 1 }}>
                        {ev.home_score}–{ev.away_score}
                      </div>
                      {ev.home_score_ht != null && (
                        <div className="text-[10px] text-[#555] mt-1">HT: {ev.home_score_ht}–{ev.away_score_ht}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Away */}
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #2a2a2a', background: '#0d0d0d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FlagImg country={ev.away_team} width={42} />
                    </div>
                  </div>
                  <div className="font-display text-bg leading-none tracking-wide" style={{ fontSize: 24 }}>
                    {ev.away_team.toUpperCase()}
                  </div>
                  {(isFinished || !isSoon) && ev.goal_scorers && ev.goal_scorers.filter(g => !g.is_home).length > 0 && (
                    <div className="mt-1.5 flex flex-col items-end gap-0.5">
                      {ev.goal_scorers.filter(g => !g.is_home).map((g, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#888', letterSpacing: 0.5 }}>
                          {g.player}{g.own_goal ? ' (og)' : ''} {g.minute}&apos; ⚽
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between mt-3 pt-2 text-[10px] text-[#444]"
                style={{ borderTop: '0.5px solid #222' }}>
                <span>
                  {isFinished ? 'Stats processing · tap for details →' : isSoon ? 'Tap for match preview →' : 'Click for full details →'}
                </span>
                <span style={{ color: isFinished ? '#888' : isSoon ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                  {isFinished ? 'FULL TIME' : isSoon ? 'STARTING SOON' : 'LIVE'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
