'use client'

import { useState } from 'react'
import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import fadeStyles from './ScrollFade.module.css'

export interface TeamResult {
  id: number
  opponent: string
  isHome: boolean
  gf: number
  ga: number
  result: 'W' | 'D' | 'L'
  roundName: string
  date: string
}

export interface RosterPlayer {
  id: number
  name: string
  position: string
  specificPosition: string
  jerseyNumber: number | null
  currentTeamName: string
  age: string
  imageUrl?: string
}

export interface StatLeader {
  playerId:  number | null
  name:      string
  pos:       string
  imageUrl:  string | null
  goals:     number
  assists:   number
  avgRating: string
  yellow:    number
  red:       number
}

export interface MatchStatRow {
  id: number
  opponent: string
  isHome: boolean
  gf: number
  ga: number
  result: 'W' | 'D' | 'L'
  date: string
  roundName: string
  possession: number | null
  shots: number | null
  shotsOn: number | null
  xg: number | null
  corners: number | null
  yellowCards: number | null
  redCards: number | null
  passAccuracy: number | null
  bigChances: number | null
}

export interface UpcomingMatch {
  id: number
  opponent: string
  isHome: boolean
  date: string
  time: string
  roundName: string
  venueName: string
  venueCity: string
}

export interface TeamFormRow {
  id:            number
  opponent:      string
  opponentId:    number | null
  competition:   string
  isHome:        boolean
  eventDate:     string
  result:        string | null
  teamScore:     number | null
  opponentScore: number | null
  possession:    number | null
  shots:         number | null
  shotsOn:       number | null
  xg:            number | null
  corners:       number | null
  yellowCards:   number | null
  redCards:      number | null
  passAccuracy:  number | null
  bigChances:    number | null
}

export interface TeamDesignProps {
  teamId: number
  teamName: string
  group: string
  groupRank: number
  coachName: string
  coachCountry: string
  venueInfo: { name: string; city: string; country: string; capacity: number } | null
  groupStanding: { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; pts: number } | null
  roster: RosterPlayer[]
  teamResults: TeamResult[]
  statLeaders: StatLeader[]
  homeKitColor: string | null
  awayKitColor: string | null
  matchStatRows: MatchStatRow[]
  upcomingMatches: UpcomingMatch[]
  teamForm: TeamFormRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n: number) {
  return ['', '1ST', '2ND', '3RD', '4TH'][n] ?? `${n}TH`
}

function resultColor(r: string) {
  return r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#f59e0b'
}

const POS_LABELS: Record<string, string> = { G: 'GOALKEEPERS', D: 'DEFENDERS', M: 'MIDFIELDERS', F: 'FORWARDS' }
const POS_COLOR:  Record<string, string> = { G: '#f59e0b',     D: '#3b82f6',   M: '#8b5cf6',     F: '#ef4444'  }

function compBadge(competition: string): string {
  const c = competition.toLowerCase()
  if (c.includes('world cup 2026'))   return 'WC 26'
  if (c.includes('world cup 2022'))   return 'WC 22'
  if (c.includes('world cup 2018'))   return 'WC 18'
  if (c.includes('world cup 2014'))   return 'WC 14'
  if (c.includes('world cup'))        return 'WC'
  if (c.includes('gold cup 2025'))    return 'GC 25'
  if (c.includes('gold cup 2024'))    return 'GC 24'
  if (c.includes('gold cup'))         return 'GC'
  if (c.includes('nations league'))   return 'NL'
  if (c.includes('friendly'))         return 'FRI'
  return competition.slice(0, 5).toUpperCase()
}

const fmt = (v: number | null, decimals = 0) =>
  v === null ? '—' : decimals ? v.toFixed(decimals) : String(v)

// ── Shared: match stats table body ───────────────────────────────────────────
function MatchStatsTable({ rows, accent }: { rows: MatchStatRow[]; accent: string }) {
  return (
    <div className={fadeStyles.fadeWrap} style={{ '--fade-bg': '#0d0d0d' } as React.CSSProperties}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              {['MATCH', 'SCORE', 'POSS%', 'SHOTS', 'ON TGT', 'xG', 'CORNERS', 'YC', 'RC', 'PASS%', 'CHANCES'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: h === 'MATCH' ? 'left' : 'center', fontSize: 9, letterSpacing: 2, color: '#777', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const rc = resultColor(row.result)
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <Link href={`/matches/${row.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: `${rc}22`, border: `1px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: rc, flexShrink: 0 }}>{row.result}</div>
                        <FlagImg country={row.opponent} width={16} cdnSize={40} style={{ borderRadius: 1, flexShrink: 0 }} />
                        <span style={{ color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.isHome ? 'vs' : '@'} {row.opponent}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#777', marginTop: 3, paddingLeft: 30 }}>{row.date}{row.roundName ? ` · ${row.roundName}` : ''}</div>
                    </Link>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: accent, padding: '10px 10px' }}>{row.gf}–{row.ga}</td>
                  <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                    {row.possession !== null ? (
                      <div>
                        <div style={{ color: '#fff' }}>{row.possession}%</div>
                        <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, width: 40, margin: '4px auto 0' }}>
                          <div style={{ height: '100%', background: accent, borderRadius: 2, width: `${row.possession}%` }} />
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.shots)}</td>
                  <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.shotsOn)}</td>
                  <td style={{ textAlign: 'center', color: accent, padding: '10px 10px', fontWeight: 600 }}>{fmt(row.xg, 2)}</td>
                  <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.corners)}</td>
                  <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                    {row.yellowCards !== null && row.yellowCards > 0
                      ? <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: row.yellowCards }).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 9, height: 12, background: '#facc15', borderRadius: 1 }} />)}</span>
                      : <span style={{ color: '#666' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                    {row.redCards !== null && row.redCards > 0
                      ? <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: row.redCards }).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 9, height: 12, background: '#ef4444', borderRadius: 1 }} />)}</span>
                      : <span style={{ color: '#666' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.passAccuracy, 1)}{row.passAccuracy !== null ? '%' : ''}</td>
                  <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.bigChances)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = ['OVERVIEW', 'MATCHES', 'SQUAD', 'STATS', 'FORM'] as const
type Tab = typeof TABS[number]

// ── Main component ────────────────────────────────────────────────────────────
export default function TeamDesignTabs(p: TeamDesignProps) {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW')
  const accent = p.homeKitColor ? `#${p.homeKitColor}` : '#e8c23a'

  const wins   = p.matchStatRows.filter(r => r.result === 'W').length
  const draws  = p.matchStatRows.filter(r => r.result === 'D').length
  const losses = p.matchStatRows.filter(r => r.result === 'L').length

  const byPos: Record<string, RosterPlayer[]> = { G: [], D: [], M: [], F: [] }
  for (const pl of p.roster) {
    const k = pl.position?.toUpperCase()?.[0] ?? 'M'
    byPos[k in byPos ? k : 'M'].push(pl)
  }

  // Stats strip helpers
  const isKO = (rn: string) =>
    /round of (16|32)|quarter.?final|semi.?final|third place|^final$/i.test(rn ?? '')
  const groupRows  = p.matchStatRows.filter(r => !isKO(r.roundName))
  const koRows     = p.matchStatRows.filter(r =>  isKO(r.roundName))
  const koUpcoming = p.upcomingMatches.filter(m => isKO(m.roundName))
  const inKO       = koRows.length > 0 || koUpcoming.length > 0
  const gs         = p.groupStanding
  const tourGF     = p.matchStatRows.reduce((s, r) => s + r.gf, 0)
  const tourGA     = p.matchStatRows.reduce((s, r) => s + r.ga, 0)
  const tourGD     = tourGF - tourGA
  const dispGF     = inKO ? tourGF  : (gs?.gf ?? 0)
  const dispGA     = inKO ? tourGA  : (gs?.ga ?? 0)
  const rawGD      = inKO ? tourGD  : (gs?.gd ?? 0)
  const dispGD     = (rawGD >= 0 ? '+' : '') + rawGD
  const totalPlayed = p.matchStatRows.length
  const totalAll    = totalPlayed + p.upcomingMatches.length
  const pos         = p.groupRank > 0 ? ordinal(p.groupRank) : '—'
  const stageFor = (rn: string) => {
    if (/round of 32/i.test(rn))    return 'R32'
    if (/round of 16/i.test(rn))    return 'R16'
    if (/quarter.?final/i.test(rn)) return 'QF'
    if (/semi.?final/i.test(rn))    return 'SF'
    if (/third place/i.test(rn))    return '3RD'
    if (/^final$/i.test(rn))        return 'FINAL'
    return rn.slice(0, 4).toUpperCase()
  }
  const latestKORound = koRows[koRows.length - 1]?.roundName ?? koUpcoming[0]?.roundName ?? ''
  const stageShort    = latestKORound ? stageFor(latestKORound) : '—'
  const groupDots     = groupRows.map(r => ({ c: resultColor(r.result), l: r.result }))
  const groupEmpty    = inKO ? 0 : Math.max(0, 3 - groupRows.length)
  const koDots        = koRows.map(r => ({ c: resultColor(r.result), l: r.result }))
  const koEmptyCount  = koUpcoming.length

  // Overview stats
  const avgPoss = p.matchStatRows.filter(r => r.possession !== null).length > 0
    ? (p.matchStatRows.reduce((s, r) => s + (r.possession ?? 0), 0) / p.matchStatRows.filter(r => r.possession !== null).length).toFixed(0)
    : null
  const avgXg = p.matchStatRows.filter(r => r.xg !== null).length > 0
    ? (p.matchStatRows.reduce((s, r) => s + (r.xg ?? 0), 0) / p.matchStatRows.filter(r => r.xg !== null).length).toFixed(2)
    : null
  const cleanSheets = p.matchStatRows.filter(r => r.ga === 0).length

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#fff' }}>

      {/* ── Hero Banner ── */}
      <div style={{ background: `linear-gradient(135deg, #0d0d0d 40%, ${accent}22 100%)`, borderBottom: `3px solid ${accent}`, padding: '32px 24px' }}>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5" style={{ minWidth: 0, flex: '1 1 auto' }}>
            <FlagImg country={p.teamName} width={96} cdnSize={160} style={{ borderRadius: 4, boxShadow: `0 0 32px ${accent}55`, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: accent, fontWeight: 700, marginBottom: 4 }}>
                {p.group}{p.groupRank > 0 ? ` · ${ordinal(p.groupRank)} IN GROUP` : ''} · FIFA WORLD CUP 2026
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 7vw, 56px)', lineHeight: 1.1, letterSpacing: 2, color: '#fff', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {p.teamName.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                {p.coachName || '—'}{p.coachCountry ? ` · ${p.coachCountry}` : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {([
              { v: wins,   l: 'WIN',  c: '#22c55e' },
              { v: draws,  l: 'DRAW', c: '#f59e0b' },
              { v: losses, l: 'LOSS', c: '#ef4444' },
            ] as const).map(({ v, l, c }) => (
              <div key={l} style={{ background: `${c}18`, border: `2px solid ${c}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, color: c, letterSpacing: 2, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      {(gs !== null || p.matchStatRows.length > 0) && (
        <div className={fadeStyles.fadeWrap} style={{ borderBottom: '1px solid #1e1e1e', background: '#0a0a0a', '--fade-bg': '#0a0a0a' } as React.CSSProperties}>
          <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
            <div style={{ display: 'flex', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
              <div style={{ padding: '18px 24px', textAlign: 'center', borderRight: '1px solid #1a1a1a' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: accent, lineHeight: 1, fontWeight: 800 }}>{pos}</div>
                <div style={{ fontSize: 9, color: '#888', letterSpacing: 2, marginTop: 5 }}>{inKO ? 'GROUP FINISH' : 'POSITION'}</div>
                {p.group && <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginTop: 3 }}>{p.group.toUpperCase()}</div>}
              </div>
              <div style={{ padding: '18px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: inKO ? '#fff' : accent, lineHeight: 1, fontWeight: 800 }}>
                  {inKO ? stageShort : (gs?.pts ?? 0)}
                </div>
                <div style={{ fontSize: 9, color: inKO ? accent : '#888', letterSpacing: 2, marginTop: 5 }}>{inKO ? 'STAGE' : 'POINTS'}</div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: '#777', letterSpacing: 2, marginBottom: 12, whiteSpace: 'nowrap' }}>
                {inKO ? 'WC 2026 JOURNEY' : 'GROUP STAGE'} · {totalPlayed}/{totalAll}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {groupDots.map((d, i) => (
                  <div key={`g${i}`} style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: d.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#000', fontWeight: 700 }}>{d.l}</span>
                  </div>
                ))}
                {Array(groupEmpty).fill(null).map((_, i) => (
                  <div key={`ge${i}`} style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: '2px solid #2a2a2a' }} />
                ))}
                {inKO && <div style={{ width: 1, height: 36, background: '#2a2a2a', margin: '0 4px', flexShrink: 0 }} />}
                {koDots.map((d, i) => (
                  <div key={`k${i}`} style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: d.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#000', fontWeight: 700 }}>{d.l}</span>
                  </div>
                ))}
                {Array(koEmptyCount).fill(null).map((_, i) => (
                  <div key={`ke${i}`} style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: `2px dashed ${accent}55` }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
              {[
                { l: 'GOALS FOR',     v: dispGF },
                { l: 'GOALS AGAINST', v: dispGA },
                { l: 'GOAL DIFF',     v: dispGD },
              ].map(({ l, v }) => (
                <div key={l} style={{ flexShrink: 0, minWidth: 88, padding: '18px 10px', textAlign: 'center', borderRight: '1px solid #1a1a1a' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#888', lineHeight: 1, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginTop: 6, whiteSpace: 'nowrap' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div style={{ borderBottom: `2px solid #1a1a1a`, background: '#080808', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className={fadeStyles.hideScrollbar} style={{ display: 'flex', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 22px',
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: 700,
                color: activeTab === tab ? accent : '#555',
                borderBottom: `2px solid ${activeTab === tab ? accent : 'transparent'}`,
                background: 'none',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === tab ? accent : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: -2,
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: 24 }}>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Key stat cards */}
            {p.matchStatRows.length > 0 && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 14 }}>TOURNAMENT STATS</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'AVG POSSESSION', value: avgPoss ? `${avgPoss}%` : '—' },
                    { label: 'AVG xG',         value: avgXg ?? '—' },
                    { label: 'CLEAN SHEETS',   value: String(cleanSheets) },
                    { label: 'GOALS SCORED',   value: String(tourGF) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#111', border: '1px solid #1e1e1e', borderLeft: `3px solid ${accent}`, padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: accent, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginTop: 6 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next match */}
            {p.upcomingMatches.length > 0 && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 14 }}>NEXT MATCH</div>
                {(() => {
                  const m = p.upcomingMatches[0]
                  return (
                    <Link href={`/matches/${m.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#111', border: `1px solid ${accent}44`, borderRadius: 8, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <FlagImg country={m.opponent} width={40} cdnSize={80} style={{ borderRadius: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff' }}>{m.isHome ? 'vs' : '@'} {m.opponent.toUpperCase()}</div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{m.date} · {m.time}{m.venueName ? ` · ${m.venueName}` : ''}</div>
                        </div>
                        <div style={{ fontSize: 11, letterSpacing: 1, color: accent }}>{m.roundName}</div>
                      </div>
                    </Link>
                  )
                })()}
              </div>
            )}

            {/* Recent WC results */}
            {p.matchStatRows.length > 0 && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 14 }}>RECENT WC RESULTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[...p.matchStatRows].reverse().slice(0, 3).map(row => {
                    const rc = resultColor(row.result)
                    return (
                      <Link key={row.id} href={`/matches/${row.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#111', borderLeft: `3px solid ${rc}` }}>
                        <div style={{ width: 24, height: 24, borderRadius: 4, background: `${rc}22`, border: `1px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: rc, flexShrink: 0 }}>{row.result}</div>
                        <FlagImg country={row.opponent} width={20} cdnSize={40} style={{ borderRadius: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>{row.isHome ? 'vs' : '@'} {row.opponent}</div>
                          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{row.date} · {row.roundName}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: accent }}>{row.gf}–{row.ga}</div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Venue */}
            {p.venueInfo && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 14 }}>WC 2026 VENUE</div>
                <div style={{ background: '#111', border: `1px solid ${accent}33`, borderRadius: 8, padding: 20 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff', marginBottom: 4 }}>{p.venueInfo.name.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{p.venueInfo.city}, {p.venueInfo.country}</div>
                  <div style={{ fontSize: 11, color: accent, marginTop: 8 }}>CAP. {p.venueInfo.capacity.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ MATCHES ══ */}
        {activeTab === 'MATCHES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {p.matchStatRows.length > 0 ? (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 16 }}>WC 2026 PERFORMANCE</div>
                <MatchStatsTable rows={p.matchStatRows} accent={accent} />
                <div style={{ fontSize: 9, color: '#666', marginTop: 12, letterSpacing: 1 }}>
                  POSS = Possession · ON TGT = Shots on Target · xG = Expected Goals · YC = Yellow Cards · RC = Red Cards · PASS% = Pass Accuracy · CHANCES = Big Chances
                </div>
              </div>
            ) : (
              <div style={{ color: '#555', fontSize: 13 }}>No WC 2026 matches played yet.</div>
            )}

            {p.upcomingMatches.length > 0 && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 14 }}>UPCOMING FIXTURES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {p.upcomingMatches.map(m => (
                    <Link key={m.id} href={`/matches/${m.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#111', borderLeft: `3px solid ${accent}44` }}>
                      <div style={{ flexShrink: 0, width: 48 }}>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{m.date}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>{m.time}</div>
                      </div>
                      <FlagImg country={m.opponent} width={20} cdnSize={40} style={{ borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>{m.isHome ? 'vs' : '@'} {m.opponent}</div>
                        {(m.venueName || m.venueCity) && (
                          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{[m.venueName, m.venueCity].filter(Boolean).join(', ')}</div>
                        )}
                      </div>
                      {m.roundName && <div style={{ fontSize: 9, color: '#777' }}>{m.roundName}</div>}
                      <div style={{ fontSize: 12, color: accent }}>→</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ SQUAD ══ */}
        {activeTab === 'SQUAD' && (
          <div>
            {p.roster.length === 0 && <div style={{ color: '#555', fontSize: 13 }}>No squad data available.</div>}
            {(['G', 'D', 'M', 'F'] as const).map(pos => {
              const players = byPos[pos] ?? []
              if (!players.length) return null
              return (
                <div key={pos} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 14, background: POS_COLOR[pos], borderRadius: 2 }} />
                    <span style={{ fontSize: 9, letterSpacing: 3, color: POS_COLOR[pos] }}>{POS_LABELS[pos]}</span>
                    <span style={{ fontSize: 9, color: '#444', marginLeft: 4 }}>{players.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {players
                      .sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
                      .map(pl => (
                        <Link
                          key={pl.id}
                          href={`/players/${pl.id}`}
                          style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '10px 14px', minWidth: 130, display: 'block', textDecoration: 'none', borderTop: `2px solid ${POS_COLOR[pos]}33` }}
                        >
                          {pl.imageUrl && (
                            <img src={pl.imageUrl} alt={pl.name} width={48} height={48}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', marginBottom: 6, border: '1px solid #2a2a2a' }} />
                          )}
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#444', lineHeight: 1 }}>{pl.jerseyNumber ?? '—'}</div>
                          <div style={{ fontSize: 12, color: '#fff', marginTop: 3, fontWeight: 500 }}>{pl.name}</div>
                          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{pl.specificPosition} · {pl.age}y</div>
                          {pl.currentTeamName && <div style={{ fontSize: 9, color: '#444', marginTop: 3 }}>{pl.currentTeamName}</div>}
                        </Link>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ STATS ══ */}
        {activeTab === 'STATS' && (
          <div>
            {p.statLeaders.length === 0 ? (
              <div style={{ color: '#555', fontSize: 13 }}>No player stats available yet.</div>
            ) : (
              <>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 16 }}>PLAYER STATS — WC 2026 · RANKED BY RATING</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <th style={{ padding: '8px 12px', width: 32, textAlign: 'center', fontSize: 9, letterSpacing: 2, color: '#555', fontWeight: 400 }}>#</th>
                        {['PLAYER', 'POS', 'GOALS', 'ASSISTS', 'AVG RTG', 'YC', 'RC'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h === 'PLAYER' ? 'left' : 'center', fontSize: 9, letterSpacing: 2, color: '#777', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.statLeaders.map((pl, i) => {
                        const posKey  = pl.pos?.toUpperCase()?.[0] ?? 'M'
                        const posColor = POS_COLOR[posKey in POS_COLOR ? posKey : 'M']
                        const initials = pl.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                        const ratingNum = pl.avgRating !== '—' ? parseFloat(pl.avgRating) : 0
                        const ratingColor = ratingNum >= 8 ? '#22c55e' : ratingNum >= 6.5 ? accent : '#aaa'
                        const playerContent = (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {pl.imageUrl
                                ? <img src={pl.imageUrl} alt={pl.name} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{initials}</span>}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, color: pl.playerId ? '#e8e4dc' : '#aaa', fontWeight: 500 }}>{pl.name || '—'}</div>
                            </div>
                          </div>
                        )
                        return (
                          <tr key={`${pl.name}-${i}`} style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? 'transparent' : '#0a0a0a' }}>
                            <td style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, color: '#444', fontWeight: 700 }}>{i + 1}</td>
                            <td style={{ padding: '10px 12px' }}>
                              {pl.playerId
                                ? <Link href={`/players/${pl.playerId}`} style={{ textDecoration: 'none' }}>{playerContent}</Link>
                                : playerContent}
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              <span style={{ fontSize: 9, color: posColor, letterSpacing: 1, background: `${posColor}18`, padding: '2px 6px', borderRadius: 3 }}>{pl.pos || '—'}</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: pl.goals > 0 ? accent : '#333' }}>{pl.goals}</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: pl.assists > 0 ? '#fff' : '#333' }}>{pl.assists}</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: ratingColor }}>{pl.avgRating}</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              {pl.yellow > 0
                                ? <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: Math.min(pl.yellow, 3) }).map((_, j) => <span key={j} style={{ display: 'inline-block', width: 9, height: 12, background: '#facc15', borderRadius: 1 }} />)}</span>
                                : <span style={{ color: '#333' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                              {pl.red > 0
                                ? <span style={{ display: 'inline-block', width: 9, height: 12, background: '#ef4444', borderRadius: 1 }} />
                                : <span style={{ color: '#333' }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ FORM ══ */}
        {activeTab === 'FORM' && (
          <div>
            {p.teamForm.length === 0 ? (
              <div style={{ color: '#555', fontSize: 13 }}>No recent matches found.</div>
            ) : (
              <>
                <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 16 }}>LAST 10 MATCHES — ALL COMPETITIONS</div>
                <div className={fadeStyles.fadeWrap} style={{ '--fade-bg': '#0d0d0d' } as React.CSSProperties}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                          {['MATCH', 'SCORE', 'POSS%', 'SHOTS', 'ON TGT', 'xG', 'CORNERS', 'YC', 'RC', 'PASS%', 'CHANCES'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: h === 'MATCH' ? 'left' : 'center', fontSize: 9, letterSpacing: 2, color: '#777', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {p.teamForm.map(row => {
                          const rc      = row.result === 'W' ? '#22c55e' : row.result === 'L' ? '#ef4444' : row.result === 'D' ? '#f59e0b' : '#555'
                          const dateStr = new Date(row.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          const badge   = compBadge(row.competition)
                          const isWC26  = row.competition.toLowerCase().includes('world cup 2026')
                          const inner = (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 4, background: row.result ? `${rc}22` : '#111', border: `1px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: rc, flexShrink: 0 }}>{row.result ?? '·'}</div>
                                <span style={{ fontSize: 8, letterSpacing: 1, color: '#888', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '2px 5px', flexShrink: 0 }}>{badge}</span>
                                <FlagImg country={row.opponent} width={16} cdnSize={40} style={{ borderRadius: 1, flexShrink: 0 }} />
                                <span style={{ color: '#ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.isHome ? 'vs' : '@'} {row.opponent}</span>
                              </div>
                              <div style={{ fontSize: 10, color: '#777', marginTop: 3, paddingLeft: 30 }}>{dateStr}</div>
                            </>
                          )
                          return (
                            <tr key={`${row.id}-${row.isHome}`} style={{ borderBottom: '1px solid #111' }}>
                              <td style={{ padding: '10px 10px' }}>
                                {isWC26 ? <Link href={`/matches/${row.id}`} style={{ textDecoration: 'none' }}>{inner}</Link> : <div>{inner}</div>}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: row.teamScore !== null ? accent : '#555', padding: '10px 10px' }}>
                                {row.teamScore !== null ? `${row.teamScore}–${row.opponentScore}` : '—'}
                              </td>
                              <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                                {row.possession !== null ? (
                                  <div>
                                    <div style={{ color: '#fff' }}>{row.possession}%</div>
                                    <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, width: 40, margin: '4px auto 0' }}>
                                      <div style={{ height: '100%', background: accent, borderRadius: 2, width: `${row.possession}%` }} />
                                    </div>
                                  </div>
                                ) : '—'}
                              </td>
                              <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.shots)}</td>
                              <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.shotsOn)}</td>
                              <td style={{ textAlign: 'center', color: accent, padding: '10px 10px', fontWeight: 600 }}>{fmt(row.xg, 2)}</td>
                              <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.corners)}</td>
                              <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                                {row.yellowCards !== null && row.yellowCards > 0
                                  ? <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: Math.min(row.yellowCards, 3) }).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 9, height: 12, background: '#facc15', borderRadius: 1 }} />)}</span>
                                  : <span style={{ color: '#666' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                                {row.redCards !== null && row.redCards > 0
                                  ? <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: Math.min(row.redCards, 2) }).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 9, height: 12, background: '#ef4444', borderRadius: 1 }} />)}</span>
                                  : <span style={{ color: '#666' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.passAccuracy, 1)}{row.passAccuracy !== null ? '%' : ''}</td>
                              <td style={{ textAlign: 'center', color: '#ccc', padding: '10px 10px' }}>{fmt(row.bigChances)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 12, letterSpacing: 1 }}>
                  WC 26 = World Cup 2026 · GC = Gold Cup · NL = Nations League · FRI = Friendly · POSS = Possession · xG = Expected Goals · PASS% = Pass Accuracy
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
