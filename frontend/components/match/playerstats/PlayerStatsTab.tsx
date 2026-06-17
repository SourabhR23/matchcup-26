'use client'

import { useState, useMemo } from 'react'
import type { PlayerMatchStat } from '@/lib/types'
import type { LineupTeam } from '../types'

type SubTab = 'top' | 'shots' | 'attack' | 'passes' | 'defense' | 'duels' | 'goalkeeping'

type ColDef = {
  key: string
  label: string
  getValue: (p: PlayerMatchStat) => number
  display?: (p: PlayerMatchStat) => string
}

const TABS: { id: SubTab; label: string; cols: ColDef[] }[] = [
  {
    id: 'top', label: 'Top Stats',
    cols: [
      { key: 'rating',   label: 'Rating',  getValue: p => p.rating ?? 0,           display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'minutes',  label: 'Min',     getValue: p => p.minutes_played },
      { key: 'goals',    label: 'G',       getValue: p => p.goals },
      { key: 'assists',  label: 'A',       getValue: p => p.goal_assist },
      { key: 'xg',       label: 'xG',      getValue: p => p.expected_goals ?? 0,   display: p => (p.expected_goals ?? 0).toFixed(2) },
      { key: 'xa',       label: 'xA',      getValue: p => p.expected_assists ?? 0, display: p => (p.expected_assists ?? 0).toFixed(2) },
      { key: 'touches',  label: 'Touches', getValue: p => p.touches },
    ],
  },
  {
    id: 'shots', label: 'Shots',
    cols: [
      { key: 'rating',      label: 'Rating',    getValue: p => p.rating ?? 0,         display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'total_shots', label: 'Shots',     getValue: p => p.total_shots },
      { key: 'on_target',   label: 'On Target', getValue: p => p.shots_on_target },
      { key: 'xg',          label: 'xG',        getValue: p => p.expected_goals ?? 0, display: p => (p.expected_goals ?? 0).toFixed(2) },
      { key: 'key_pass',    label: 'Key Pass',  getValue: p => p.key_pass },
    ],
  },
  {
    id: 'attack', label: 'Attack',
    cols: [
      { key: 'rating',   label: 'Rating',   getValue: p => p.rating ?? 0,           display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'goals',    label: 'Goals',    getValue: p => p.goals },
      { key: 'assists',  label: 'Assists',  getValue: p => p.goal_assist },
      { key: 'xg',       label: 'xG',       getValue: p => p.expected_goals ?? 0,   display: p => (p.expected_goals ?? 0).toFixed(2) },
      { key: 'xa',       label: 'xA',       getValue: p => p.expected_assists ?? 0, display: p => (p.expected_assists ?? 0).toFixed(2) },
      { key: 'dribbles', label: 'Dribbles', getValue: p => p.won_contest,            display: p => p.total_contest > 0 ? `${p.won_contest}/${p.total_contest}` : '0' },
      { key: 'key_pass', label: 'Key Pass', getValue: p => p.key_pass },
    ],
  },
  {
    id: 'passes', label: 'Passes',
    cols: [
      { key: 'rating',     label: 'Rating',     getValue: p => p.rating ?? 0, display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'passes',     label: 'Passes',     getValue: p => p.total_pass },
      { key: 'pass_acc',   label: 'Acc %',      getValue: p => p.total_pass > 0 ? Math.round((p.accurate_pass / p.total_pass) * 100) : 0, display: p => p.total_pass > 0 ? `${Math.round((p.accurate_pass / p.total_pass) * 100)}%` : '—' },
      { key: 'long_balls', label: 'Long Balls', getValue: p => p.total_long_balls, display: p => p.total_long_balls > 0 ? `${p.accurate_long_balls}/${p.total_long_balls}` : '0' },
      { key: 'crosses',    label: 'Crosses',    getValue: p => p.total_cross,      display: p => p.total_cross > 0 ? `${p.accurate_cross}/${p.total_cross}` : '0' },
    ],
  },
  {
    id: 'defense', label: 'Defense',
    cols: [
      { key: 'rating',        label: 'Rating',        getValue: p => p.rating ?? 0, display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'tackles',       label: 'Tackles',       getValue: p => p.won_tackle,              display: p => p.total_tackle > 0 ? `${p.won_tackle}/${p.total_tackle}` : '0' },
      { key: 'clearances',    label: 'Clearances',    getValue: p => p.total_clearance },
      { key: 'interceptions', label: 'Interceptions', getValue: p => p.interception },
      { key: 'blocks',        label: 'Blocks',        getValue: p => p.blocked_scoring_attempt },
      { key: 'recoveries',    label: 'Recoveries',    getValue: p => p.ball_recovery },
    ],
  },
  {
    id: 'duels', label: 'Duels',
    cols: [
      { key: 'rating',       label: 'Rating',       getValue: p => p.rating ?? 0,  display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'ground_duels', label: 'Ground Duels', getValue: p => p.duel_won,     display: p => `${p.duel_won}/${p.duel_won + p.duel_lost}` },
      { key: 'aerial_duels', label: 'Aerial Duels', getValue: p => p.aerial_won,   display: p => `${p.aerial_won}/${p.aerial_won + p.aerial_lost}` },
      { key: 'fouls',        label: 'Fouls',        getValue: p => p.fouls },
      { key: 'fouled',       label: 'Fouled',       getValue: p => p.was_fouled },
    ],
  },
  {
    id: 'goalkeeping', label: 'Goalkeeping',
    cols: [
      { key: 'rating',   label: 'Rating',   getValue: p => p.rating ?? 0, display: p => p.rating != null ? p.rating.toFixed(1) : '—' },
      { key: 'saves',    label: 'Saves',    getValue: p => p.saves },
      { key: 'conceded', label: 'Conceded', getValue: p => p.goals_conceded },
      { key: 'punches',  label: 'Punches',  getValue: p => p.punches },
    ],
  },
]

const ratingColor = (r: number) =>
  r >= 8.0 ? '#16a34a' : r >= 7.5 ? '#2563eb' : r >= 7.0 ? '#6b7280' : '#4b5563'

interface Props {
  stats: PlayerMatchStat[]
  lineups: { home: LineupTeam; away: LineupTeam } | null
  homeTeam: string
  awayTeam: string
  homeTeamId: number
}

export default function PlayerStatsTab({ stats, lineups, homeTeam, awayTeam, homeTeamId }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('top')
  const [sortKey, setSortKey] = useState<string>('rating')
  const [teamFilter, setTeamFilter] = useState<'all' | 'home' | 'away'>('all')

  const tabDef = TABS.find(t => t.id === subTab)!

  // Build player_id → info map from lineup data
  const playerInfoMap = useMemo(() => {
    const map = new Map<number, { name: string; position: string; image_url?: string }>()
    if (!lineups) return map
    for (const p of [
      ...lineups.home.players, ...lineups.home.substitutes,
      ...lineups.away.players, ...lineups.away.substitutes,
    ]) {
      map.set(p.id, { name: p.name, position: p.position, image_url: p.image_url })
    }
    return map
  }, [lineups])

  const rows = useMemo(() => {
    let filtered = [...stats]
    if (teamFilter === 'home') filtered = filtered.filter(p => p.team_id === homeTeamId)
    if (teamFilter === 'away') filtered = filtered.filter(p => p.team_id !== homeTeamId)
    if (subTab === 'goalkeeping') filtered = filtered.filter(p => p.saves > 0 || p.goals_conceded > 0 || p.punches > 0)
    const col = tabDef.cols.find(c => c.key === sortKey) ?? tabDef.cols[0]
    return filtered.sort((a, b) => col.getValue(b) - col.getValue(a))
  }, [stats, teamFilter, subTab, sortKey, homeTeamId, tabDef])

  if (!stats.length) return (
    <div style={{ padding: 48, textAlign: 'center', fontSize: 12, color: '#666', background: '#111' }}>
      Player stats not available for this match.
    </div>
  )

  const homeAbbr = homeTeam.slice(0, 3).toUpperCase()
  const awayAbbr = awayTeam.slice(0, 3).toUpperCase()

  return (
    <div style={{ background: '#111' }}>

      {/* Sub-tab + filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1c1c1c', background: '#0d0d0d', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setSubTab(t.id); setSortKey(t.cols[0].key) }}
              style={{
                padding: '10px 14px', fontSize: 9, letterSpacing: 2, fontWeight: 700,
                background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                color: subTab === t.id ? 'var(--color-accent)' : '#555',
                borderBottom: subTab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Team filter pills */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: '0 12px', flexShrink: 0 }}>
          {(['all', 'home', 'away'] as const).map(f => (
            <button key={f} onClick={() => setTeamFilter(f)}
              style={{
                padding: '3px 8px', fontSize: 9, letterSpacing: 1, fontWeight: 700,
                background: teamFilter === f ? 'var(--color-accent)' : '#1a1a1a',
                border: '1px solid ' + (teamFilter === f ? 'var(--color-accent)' : '#2a2a2a'),
                borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase',
                color: teamFilter === f ? '#fff' : '#555',
              }}>
              {f === 'home' ? homeAbbr : f === 'away' ? awayAbbr : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
              <th style={{
                textAlign: 'left', padding: '8px 12px', fontSize: 9, letterSpacing: 2,
                color: '#333', fontWeight: 700, position: 'sticky', left: 0,
                background: '#0d0d0d', minWidth: 165, zIndex: 1,
              }}>PLAYER</th>
              {tabDef.cols.map(col => (
                <th key={col.key} onClick={() => setSortKey(col.key)}
                  style={{
                    textAlign: 'center', padding: '8px 10px', fontSize: 9, letterSpacing: 1.5,
                    color: sortKey === col.key ? 'var(--color-accent)' : '#333',
                    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 60,
                  }}>
                  {col.label}{sortKey === col.key ? ' ▼' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const info = playerInfoMap.get(p.player_id)
              const isHome = p.team_id === homeTeamId
              const name = info?.name ?? `#${p.player_id}`
              const pos  = info?.position ?? ''
              const img  = info?.image_url
              const initials = name.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              const rowBg = i % 2 === 0 ? '#111' : '#0f0f0f'

              return (
                <tr key={p.id ?? i} style={{ borderBottom: '1px solid #161616', background: rowBg }}>
                  {/* Sticky player cell */}
                  <td style={{ padding: '7px 12px', position: 'sticky', left: 0, background: rowBg, zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 34, borderRadius: 2, flexShrink: 0, background: isHome ? 'var(--color-accent)' : '#3a3a3a' }} />
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', background: '#1e1e1e',
                        border: '1px solid #2a2a2a', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {img
                          ? <img src={img} width={30} height={30} alt={name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          : <span style={{ fontSize: 9, fontWeight: 700, color: '#555' }}>{initials}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e4dc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 105 }}>
                          {name}
                        </div>
                        {pos && <div style={{ fontSize: 9, color: '#444', letterSpacing: 1, marginTop: 1 }}>{pos.toUpperCase()}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Stat cells */}
                  {tabDef.cols.map(col => {
                    const isRating = col.key === 'rating'
                    const numVal   = col.getValue(p)
                    const display  = col.display ? col.display(p) : String(numVal)
                    const active   = sortKey === col.key

                    return (
                      <td key={col.key} style={{ textAlign: 'center', padding: '7px 10px' }}>
                        {isRating && p.rating != null ? (
                          <span style={{
                            display: 'inline-block', minWidth: 34, padding: '2px 5px',
                            background: ratingColor(p.rating), borderRadius: 3,
                            fontSize: 12, fontWeight: 800, color: '#fff',
                          }}>
                            {p.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 12,
                            fontWeight: active ? 700 : 400,
                            color: active && numVal > 0 ? '#f0ece4' : numVal > 0 ? '#999' : '#333',
                          }}>
                            {display}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '10px 16px', fontSize: 9, color: '#2a2a2a', letterSpacing: 1.5, borderTop: '1px solid #1a1a1a' }}>
        {rows.length} PLAYERS · CLICK HEADERS TO SORT
      </div>
    </div>
  )
}
