'use client'

import React, { useMemo } from 'react'
import { BsdSection } from './helpers'
import { ShotmapViz } from './BsdCharts'
import FlagImg from '@/components/FlagImg'
import type { BsdMatchStats } from '@/lib/types'
import type { Incident } from '@/lib/types'
import type { ShotmapEntry } from '@/lib/types'
import type { LineupTeam } from '../types'

export function GoalCards({
  shots, homeTeam, awayTeam, incidents, playerImageMap,
}: {
  shots: ShotmapEntry[]; homeTeam: string; awayTeam: string; incidents: Incident[]
  playerImageMap?: Map<number, string>
}) {
  const goals = shots.filter(s => s.type === 'goal')
  if (goals.length === 0) return null

  const getGoalInfo = (min: number, isHome: boolean) => {
    const inc = incidents.find(i => i.type === 'goal' && i.is_home === isHome && Math.abs((i.minute ?? 0) - min) <= 2)
    return { scorer: inc?.player ?? null, scorerId: inc?.player_id ?? null }
  }

  const CW = 180, CH = 130
  const goalL = (30.34 / 68) * CW
  const goalR = (37.66 / 68) * CW
  const boxH  = (16.5 / 40) * CH

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {goals.map((goal, idx) => {
        const { scorer, scorerId } = getGoalInfo(goal.min ?? 0, goal.home)
        const scorerImage = scorerId != null ? (playerImageMap?.get(scorerId) ?? null) : null
        const teamName    = goal.home ? homeTeam : awayTeam
        const bodyLabel  = goal.body === 'head' ? 'Head' : goal.body === 'right-foot' ? 'Right foot' : goal.body === 'left-foot' ? 'Left foot' : (goal.body ?? '—')
        const sitLabel   = goal.sit === 'assisted' ? 'Assisted' : goal.sit ? goal.sit.charAt(0).toUpperCase() + goal.sit.slice(1) : '—'
        const placedLabel = goal.gml
          ? goal.gml.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : '—'
        const posY = goal.pos?.y ?? 50
        const posX = goal.pos?.x ?? 20
        const gmY  = goal.gm?.y  ?? 50
        const sX = (posY / 100) * CW
        const sY = Math.min(posX / 40, 0.97) * CH
        const gX = (gmY  / 100) * CW
        const cpX = (sX + gX) / 2
        const cpY = sY * 0.2
        const shotR = Math.max(3.5, (goal.xg ?? 0) * 14)

        return (
          <div key={idx} style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', flex: '1 1 260px', maxWidth: 360 }}>
            <div style={{ background: '#111', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="font-display" style={{ fontSize: 28, color: 'var(--color-accent)', lineHeight: 1, flexShrink: 0 }}>{goal.min}&apos;</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {scorerImage ? (
                  <img src={scorerImage} width={40} height={40} alt={scorer ?? ''} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #2a2a2a' }} />
                ) : scorer ? (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e1e1e', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>{scorer[0]}</span>
                  </div>
                ) : null}
                <div style={{ minWidth: 0 }}>
                  {scorer && <div style={{ fontSize: 14, color: '#f5f0e8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scorer}</div>}
                  <div style={{ fontSize: 10, color: '#666', letterSpacing: 1.5 }}>{teamName.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid #2a2a2a', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlagImg country={teamName} width={40} cdnSize={40} />
              </div>
            </div>

            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: '100%', display: 'block' }}>
              <rect width={CW} height={CH} fill="#0d1f0d" />
              <rect width={CW} height={CH / 2} fill="#0f230f" />
              <rect x={(13.84/68)*CW} y={0} width={(40.32/68)*CW} height={boxH}
                fill="none" stroke="#2a5a2a" strokeWidth={0.7} />
              <rect x={(24.84/68)*CW} y={0} width={(18.32/68)*CW} height={(5.5/40)*CH}
                fill="none" stroke="#2a5a2a" strokeWidth={0.5} />
              <circle cx={CW/2} cy={(11/40)*CH} r={0.8} fill="#2a5a2a" />
              <rect x={goalL} y={-1} width={goalR-goalL} height={3.5}
                fill="#1c2e1c" stroke="#3a6a3a" strokeWidth={0.6} />
              <path d={`M ${sX} ${sY} Q ${cpX} ${cpY} ${gX} 2`}
                fill="none" strokeWidth={1} strokeDasharray="4,2" opacity={0.65}
                style={{ stroke: 'var(--color-accent)' }} />
              <circle cx={sX} cy={sY} r={shotR} style={{ fill: 'var(--color-accent)' }} opacity={0.85} />
              <circle cx={sX} cy={sY} r={shotR + 2}
                fill="none" strokeWidth={0.5} opacity={0.3} style={{ stroke: 'var(--color-accent)' }} />
              <circle cx={gX} cy={2} r={2.5} fill="#fff" opacity={0.9} />
              <circle cx={gX} cy={2} r={1} style={{ fill: 'var(--color-accent)' }} />
            </svg>

            <div style={{ padding: '10px 16px 14px', borderTop: '0.5px solid #1c1c1c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div>
                  <span className="font-display" style={{ fontSize: 26, color: '#f5f0e8' }}>{(goal.xg ?? 0).toFixed(2)}</span>
                  <span style={{ fontSize: 9, color: '#777', marginLeft: 4, letterSpacing: 1 }}>xG</span>
                </div>
                {goal.xgot != null && (
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#555' }}>{goal.xgot.toFixed(2)}</span>
                    <span style={{ fontSize: 7, color: '#666', marginLeft: 3, letterSpacing: 1 }}>xGOT</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {([
                  ['BODY', bodyLabel],
                  ['SITUATION', sitLabel],
                  ['DISTANCE', posX != null ? `${posX.toFixed(1)}m` : '—'],
                  ['PLACED', placedLabel],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 7, color: '#666', letterSpacing: 1 }}>{k}</div>
                    <div style={{ fontSize: 11, color: k === 'PLACED' ? 'var(--color-accent)' : '#888', marginTop: 2, fontWeight: k === 'PLACED' ? 600 : 400 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ShotQualityChart({
  shots, homeTeam, awayTeam,
}: {
  shots: ShotmapEntry[]; homeTeam: string; awayTeam: string
}) {
  const maxXg = Math.max(...shots.map(s => s.xg ?? 0), 0.1)
  const typeColor = (t: string) =>
    t === 'goal'  ? 'var(--color-accent)' :
    t === 'save'  ? '#f5a623' :
    t === 'post'  ? '#cc8800' :
    t === 'block' ? '#8a8a8a' : '#5a5a5a'
  const typeLabel = (t: string) =>
    ({ goal: 'GOAL', save: 'ON TGT', block: 'BLOCKED', miss: 'MISS', post: 'POST' } as Record<string,string>)[t] ?? t.toUpperCase()

  const homeShots = shots.filter(s => s.home).sort((a, b) => (b.xg ?? 0) - (a.xg ?? 0))
  const awayShots = shots.filter(s => !s.home).sort((a, b) => (b.xg ?? 0) - (a.xg ?? 0))
  const hxg = homeShots.reduce((s, x) => s + (x.xg ?? 0), 0)
  const axg = awayShots.reduce((s, x) => s + (x.xg ?? 0), 0)

  const Col = ({ list, team, xg, isHome }: { list: ShotmapEntry[]; team: string; xg: number; isHome: boolean }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="font-display" style={{ fontSize: 19, color: '#f5f0e8', letterSpacing: 1 }}>
          {team.toUpperCase()}
        </span>
        <span style={{ fontSize: 22, fontWeight: 900, color: isHome ? 'var(--color-accent)' : '#c8c8c8', letterSpacing: 1 }}>
          {xg.toFixed(2)} <span style={{ fontSize: 10, color: '#777', fontWeight: 400 }}>xG</span>
        </span>
      </div>
      {list.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '0.5px solid #111' }}>
          <span style={{ fontSize: 10, color: '#666', width: 24, textAlign: 'right', flexShrink: 0 }}>{s.min ?? '?'}&apos;</span>
          <div style={{ flex: 1, height: 11, background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${((s.xg ?? 0) / maxXg) * 100}%`,
              background: typeColor(s.type), opacity: s.type === 'miss' ? 0.75 : 1,
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#888', width: 30, textAlign: 'right', flexShrink: 0 }}>{(s.xg ?? 0).toFixed(2)}</span>
          <span style={{ fontSize: 9, color: typeColor(s.type), width: 42, textAlign: 'right', flexShrink: 0, letterSpacing: 0.5 }}>
            {typeLabel(s.type)}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <Col list={homeShots} team={homeTeam} xg={hxg} isHome={true} />
      <Col list={awayShots} team={awayTeam} xg={axg} isHome={false} />
    </div>
  )
}

export function AttackZones({
  shots, homeTeam, awayTeam,
}: {
  shots: ShotmapEntry[]; homeTeam: string; awayTeam: string
}) {
  type Cell = { shots: number; xg: number; goals: number }
  const empty = (): Cell => ({ shots: 0, xg: 0, goals: 0 })

  const buildGrid = (ts: ShotmapEntry[]): Cell[][] => {
    const g: Cell[][] = Array.from({ length: 3 }, () => [empty(), empty(), empty()])
    for (const s of ts) {
      if (!s.pos) continue
      const d = s.pos.x <= 5.5 ? 0 : s.pos.x <= 16.5 ? 1 : 2
      const l = s.pos.y < 33 ? 0 : s.pos.y <= 66 ? 1 : 2
      g[d][l].shots++
      g[d][l].xg += s.xg ?? 0
      if (s.type === 'goal') g[d][l].goals++
    }
    return g
  }

  const homeGrid = buildGrid(shots.filter(s => s.home))
  const awayGrid = buildGrid(shots.filter(s => !s.home))
  const maxS = Math.max(1, ...[homeGrid, awayGrid].flatMap(g => g.flatMap(r => r.map(c => c.shots))))
  const depthLabels = ['6-YD', 'BOX', 'OUT']

  const Grid = ({ grid, isHome }: { grid: Cell[][]; isHome: boolean }) => (
    <div>
      <div className="font-display" style={{ fontSize: 18, color: '#f5f0e8', marginBottom: 10, letterSpacing: 1 }}>
        {isHome ? homeTeam.toUpperCase() : awayTeam.toUpperCase()}
      </div>
      {grid.map((row, di) => (
        <div key={di} style={{ display: 'flex', gap: 3, marginBottom: 3, alignItems: 'stretch' }}>
          <span style={{ fontSize: 10, color: '#888', letterSpacing: 0.5, width: 28, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {depthLabels[di]}
          </span>
          {row.map((cell, li) => (
            <div key={li} style={{
              flex: 1, height: 52, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              border: '0.5px solid #1a1a1a',
              background: cell.shots > 0
                ? `rgba(${isHome ? '200,40,40' : '120,120,120'}, ${0.07 + (cell.shots / maxS) * 0.65})`
                : '#0d0d0d',
            }}>
              {cell.shots > 0 ? (
                <>
                  <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: cell.goals > 0 ? 'var(--color-accent)' : '#f5f0e8' }}>
                    {cell.shots}
                  </span>
                  <span style={{ fontSize: 9, color: '#666' }}>{cell.xg.toFixed(1)}xG</span>
                  {cell.goals > 0 && (
                    <span style={{ fontSize: 9, color: 'var(--color-accent)', fontWeight: 800 }}>{cell.goals}G</span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#222' }}>—</span>
              )}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', paddingLeft: 31, gap: 3 }}>
        {['L', 'C', 'R'].map(l => (
          <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#666' }}>{l}</div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Grid grid={homeGrid} isHome={true} />
        <Grid grid={awayGrid} isHome={false} />
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 10, color: '#666', letterSpacing: 1 }}>
          6-YD = 6-yard box · BOX = penalty area · OUT = outside box
        </span>
      </div>
    </div>
  )
}

export default function BsdVizPanel({
  bsd, homeTeam, awayTeam, incidents, lineups,
}: {
  bsd: BsdMatchStats; homeTeam: string; awayTeam: string; incidents: Incident[]
  lineups?: { home: LineupTeam; away: LineupTeam } | null
}) {
  const shotmap = bsd.shotmap ?? []

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

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 32 }}>
      <div className="font-display" style={{ fontSize: 18, color: 'var(--color-accent)', letterSpacing: 3, borderBottom: '1px solid #2a2a2a', paddingBottom: 8, marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ background: '#111', padding: '0 24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1a1a1a', marginBottom: 24, gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#f5f0e8', letterSpacing: 1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.toUpperCase()}</span>
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#666', flexShrink: 0 }}>MATCH ANALYSIS</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#f5f0e8', letterSpacing: 1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{awayTeam.toUpperCase()}</span>
      </div>

      {shotmap.filter(s => s.type === 'goal').length > 0 && (
        <Sec title="GOAL BREAKDOWN">
          <GoalCards shots={shotmap} homeTeam={homeTeam} awayTeam={awayTeam} incidents={incidents} playerImageMap={playerImageMap} />
        </Sec>
      )}

      {shotmap.length > 0 && (
        <Sec title="SHOT QUALITY  —  ORDERED BY xG">
          <ShotQualityChart shots={shotmap} homeTeam={homeTeam} awayTeam={awayTeam} />
        </Sec>
      )}

      {shotmap.length > 0 && (
        <Sec title="ATTACK ZONES">
          <AttackZones shots={shotmap} homeTeam={homeTeam} awayTeam={awayTeam} />
        </Sec>
      )}
    </div>
  )
}
