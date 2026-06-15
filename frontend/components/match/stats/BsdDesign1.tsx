'use client'

import { useState, useMemo } from 'react'
import bsdStyles from './BsdDesign1.module.css'
import { BsdSection, BsdStatRow, BsdFracRow } from './helpers'
import { PossessionBar, ShotmapViz, XgTimeline, MomentumWave, AvgPositionsViz } from './BsdCharts'
import type { BsdMatchStats, Incident } from '@/lib/types'
import type { LineupTeam } from '../types'
import IncidentTimeline from '@/components/IncidentTimeline'

export default function BsdDesign1Broadcast({
  bsd, homeTeam, awayTeam, homeAbbr, awayAbbr, incidents, xgHome, xgAway, lineups,
}: {
  bsd: BsdMatchStats; homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string
  incidents: Incident[]; xgHome: number | null; xgAway: number | null
  lineups?: { home: LineupTeam; away: LineupTeam } | null
}) {
  const playerMap = useMemo(() => {
    const m = new Map<number, string>()
    if (!lineups) return m
    for (const p of [...lineups.home.players, ...lineups.home.substitutes,
                     ...lineups.away.players, ...lineups.away.substitutes]) {
      m.set(p.id, p.name)
    }
    return m
  }, [lineups])

  const playerImageMap = useMemo(() => {
    const m = new Map<number, string>()
    if (!lineups) return m
    for (const p of [...lineups.home.players, ...lineups.home.substitutes,
                     ...lineups.away.players, ...lineups.away.substitutes]) {
      const img = (p as { image_url?: string }).image_url
      if (img) m.set(p.id, img)
    }
    return m
  }, [lineups])

  const [halfView, setHalfView] = useState<'all' | '1st' | '2nd'>('all')

  const getHalfSide = (side: 'home' | 'away') => {
    if (halfView === '1st' && bsd.stats.first_half) return bsd.stats.first_half[side] as typeof bsd.stats.home
    if (halfView === '2nd' && bsd.stats.second_half) return bsd.stats.second_half[side] as typeof bsd.stats.home
    return bsd.stats[side]
  }
  const h = getHalfSide('home')
  const a = getHalfSide('away')

  const homeYellows = incidents.filter(i => i.is_home && i.type === 'card' && i.card_type === 'yellow').length
  const awayYellows = incidents.filter(i => !i.is_home && i.type === 'card' && i.card_type === 'yellow').length
  const homeReds    = incidents.filter(i => i.is_home && i.type === 'card' && i.card_type === 'red').length
  const awayReds    = incidents.filter(i => !i.is_home && i.type === 'card' && i.card_type === 'red').length
  const displayXgHome = h.xg?.actual ?? h.expected_goals ?? (halfView === 'all' ? xgHome : null) ?? null
  const displayXgAway = a.xg?.actual ?? a.expected_goals ?? (halfView === 'all' ? xgAway : null) ?? null

  const hasHalves = !!(bsd.stats.first_half?.home && bsd.stats.second_half?.home)

  return (
    <div className={bsdStyles.root} style={{ background: '#111' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1a1a1a', marginBottom: 4, gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#f5f0e8', letterSpacing: 1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.toUpperCase()}</span>
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#666', flexShrink: 0 }}>MATCH STATS</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#f5f0e8', letterSpacing: 1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{awayTeam.toUpperCase()}</span>
      </div>

      {hasHalves && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '10px 0 6px' }}>
          {(['all', '1st', '2nd'] as const).map(v => (
            <button key={v} onClick={() => setHalfView(v)} style={{
              padding: '4px 16px', fontSize: 8, letterSpacing: 2, fontWeight: 700,
              border: `1px solid ${halfView === v ? 'var(--color-accent)' : '#2a2a2a'}`,
              background: halfView === v ? 'var(--color-accent)' : 'transparent',
              color: halfView === v ? '#000' : '#555',
              cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.12s',
            }}>
              {v === 'all' ? 'FULL TIME' : v === '1st' ? '1ST HALF' : '2ND HALF'}
            </button>
          ))}
        </div>
      )}

      <PossessionBar home={h.ball_possession ?? 50} away={a.ball_possession ?? 50} homeTeam={homeAbbr} awayTeam={awayAbbr} />
      <BsdSection title="ATTACKING" />
      <BsdStatRow label="Shots" h={h.total_shots ?? 0} a={a.total_shots ?? 0} />
      <BsdStatRow label="Shots on Target" h={h.shots_on_target ?? 0} a={a.shots_on_target ?? 0} />
      <BsdStatRow label="Shot Accuracy"
        h={(h.total_shots ?? 0) > 0 ? Math.round(((h.shots_on_target ?? 0) / (h.total_shots ?? 1)) * 100) : 0}
        a={(a.total_shots ?? 0) > 0 ? Math.round(((a.shots_on_target ?? 0) / (a.total_shots ?? 1)) * 100) : 0}
        isPercent />
      <BsdStatRow label="Big Chances" h={h.big_chances ?? 0} a={a.big_chances ?? 0} hideWhenZero />
      <BsdStatRow label="Shots Inside Box" h={h.shots_inside_box ?? 0} a={a.shots_inside_box ?? 0} hideWhenZero />
      <BsdStatRow label="Shots Outside Box" h={h.shots_outside_box ?? 0} a={a.shots_outside_box ?? 0} hideWhenZero />
      <BsdStatRow label="Blocked Shots" h={h.blocked_shots ?? 0} a={a.blocked_shots ?? 0} hideWhenZero />
      <BsdStatRow label="Hit Woodwork" h={h.hit_woodwork ?? 0} a={a.hit_woodwork ?? 0} hideWhenZero />
      <BsdStatRow label="Corners" h={h.corner_kicks ?? 0} a={a.corner_kicks ?? 0} />
      <BsdStatRow label="Offsides" h={h.offsides ?? 0} a={a.offsides ?? 0} hideWhenZero />
      {displayXgHome !== null && (
        <BsdStatRow label="Expected Goals (xG)"
          h={parseFloat((displayXgHome).toFixed(2))}
          a={parseFloat((displayXgAway ?? 0).toFixed(2))}
          fmt={(v) => v.toFixed(2)} />
      )}
      <BsdSection title="PASSING" />
      <BsdStatRow label="Total Passes" h={h.passes ?? 0} a={a.passes ?? 0} />
      <BsdStatRow label="Accurate Passes" h={h.accurate_passes ?? 0} a={a.accurate_passes ?? 0} />
      <BsdStatRow label="Pass Accuracy"
        h={h.pass_accuracy_pct ?? ((h.passes ?? 0) > 0 ? Math.round(((h.accurate_passes ?? 0) / (h.passes ?? 1)) * 100) : 0)}
        a={a.pass_accuracy_pct ?? ((a.passes ?? 0) > 0 ? Math.round(((a.accurate_passes ?? 0) / (a.passes ?? 1)) * 100) : 0)}
        isPercent />
      {h.long_balls && a.long_balls && <BsdFracRow label="Long Balls" h={h.long_balls} a={a.long_balls} hideWhenZero />}
      {h.crosses && a.crosses && <BsdFracRow label="Crosses" h={h.crosses} a={a.crosses} hideWhenZero />}
      <BsdSection title="DUELS & DRIBBLES" />
      {h.dribbles && a.dribbles && <BsdFracRow label="Dribbles" h={h.dribbles} a={a.dribbles} hideWhenZero />}
      {h.aerial_duels && a.aerial_duels && <BsdFracRow label="Aerial Duels" h={h.aerial_duels} a={a.aerial_duels} hideWhenZero />}
      {h.ground_duels && a.ground_duels && <BsdFracRow label="Ground Duels" h={h.ground_duels} a={a.ground_duels} hideWhenZero />}
      <BsdSection title="DEFENDING" />
      <BsdStatRow label="Clearances" h={h.clearances ?? 0} a={a.clearances ?? 0} hideWhenZero />
      <BsdStatRow label="Interceptions" h={h.interceptions ?? 0} a={a.interceptions ?? 0} hideWhenZero />
      <BsdStatRow label="Recoveries" h={h.recoveries ?? 0} a={a.recoveries ?? 0} hideWhenZero />
      <BsdStatRow label="Tackles Won"
        h={(h.tackles_won ?? 0) > 0 ? (h.tackles_won ?? 0) : 0}
        a={(a.tackles_won ?? 0) > 0 ? (a.tackles_won ?? 0) : 0}
        hideWhenZero fmt={(v) => `${v}%`} />
      <BsdStatRow label="Touches in Box" h={h.touches_in_penalty_area ?? 0} a={a.touches_in_penalty_area ?? 0} hideWhenZero />
      {((h.goals_prevented ?? 0) !== 0 || (a.goals_prevented ?? 0) !== 0) && (
        <BsdStatRow label="Goals Prevented"
          h={parseFloat((h.goals_prevented ?? 0).toFixed(2))}
          a={parseFloat((a.goals_prevented ?? 0).toFixed(2))}
          fmt={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)} />
      )}
      <BsdSection title="DISCIPLINE" />
      <BsdStatRow label="Fouls" h={h.fouls ?? 0} a={a.fouls ?? 0} />
      <BsdStatRow label="Free Kicks" h={h.free_kicks ?? 0} a={a.free_kicks ?? 0} hideWhenZero />
      <BsdStatRow label="Yellow Cards" h={homeYellows} a={awayYellows} />
      {(homeReds + awayReds) > 0 && <BsdStatRow label="Red Cards" h={homeReds} a={awayReds} />}
      {bsd.shotmap && bsd.shotmap.length > 0 && (
        <>
          <BsdSection title="SHOT MAP" />
          <div style={{ marginTop: 10 }}>
            <ShotmapViz shots={bsd.shotmap} homeTeam={homeTeam} awayTeam={awayTeam} playerMap={playerMap} playerImageMap={playerImageMap} />
          </div>
        </>
      )}
      {bsd.xg_per_minute && bsd.xg_per_minute.length > 0 && (
        <>
          <BsdSection title="xG TIMELINE" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#aaa', letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 2, background: 'var(--color-accent)' }} />
              <span>{homeAbbr}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{awayAbbr}</span>
              <div style={{ width: 16, height: 2, background: '#c8c8c8' }} />
            </div>
          </div>
          <XgTimeline entries={bsd.xg_per_minute} homeTeam={homeTeam} awayTeam={awayTeam} xgHome={displayXgHome} xgAway={displayXgAway} />
        </>
      )}
      {bsd.momentum && bsd.momentum.length > 0 && (
        <>
          <BsdSection title="MOMENTUM" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#aaa', letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 14, height: 6, background: 'var(--color-accent)', borderRadius: 1 }} />
              <span>{homeAbbr} PRESSURE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{awayAbbr} PRESSURE</span>
              <div style={{ width: 14, height: 6, background: '#d4d4d4', borderRadius: 1 }} />
            </div>
          </div>
          <MomentumWave momentum={bsd.momentum} homeAbbr={homeAbbr} awayAbbr={awayAbbr} goals={incidents.filter(i => i.type === 'goal').map(i => ({ minute: i.minute, isHome: !!i.is_home, isPenalty: i.goal_type === 'penalty' }))} />
        </>
      )}
      {bsd.average_positions && (bsd.average_positions.home?.length > 0 || bsd.average_positions.away?.length > 0) && (
        <>
          <BsdSection title="AVERAGE POSITIONS" />
          <div style={{ marginTop: 10 }}>
            <AvgPositionsViz positions={bsd.average_positions} homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>
        </>
      )}
      {(displayXgHome !== null || displayXgAway !== null) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a1a', marginTop: 24, paddingTop: 18 }}>
          <div>
            <div className="font-display" style={{ fontSize: 52, color: displayXgHome ? 'var(--color-accent)' : '#1e1e1e', lineHeight: 1 }}>
              {displayXgHome?.toFixed(2) ?? '—'}
            </div>
            <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 2, marginTop: 3 }}>{homeAbbr} EXPECTED GOALS</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-display" style={{ fontSize: 36, color: '#c8c8c8', lineHeight: 1 }}>
              {displayXgAway?.toFixed(2) ?? '—'}
            </div>
            <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 2, marginTop: 3 }}>{awayAbbr} EXPECTED GOALS</div>
          </div>
        </div>
      )}
    </div>
  )
}
