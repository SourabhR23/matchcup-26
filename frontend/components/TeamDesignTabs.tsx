import Link from 'next/link'
import FlagImg from '@/components/FlagImg'

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
  name: string
  pos: string
  goals: number
  assists: number
  avgRating: string
  yellow: number
  red: number
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
}

function ordinal(n: number) {
  return ['', '1ST', '2ND', '3RD', '4TH'][n] ?? `${n}TH`
}

function resultColor(r: 'W' | 'D' | 'L') {
  return r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#f59e0b'
}

const POS_LABELS: Record<string, string> = { G: 'GOALKEEPERS', D: 'DEFENDERS', M: 'MIDFIELDERS', F: 'FORWARDS' }
const POS_COLOR:  Record<string, string> = { G: '#f59e0b',    D: '#3b82f6',   M: '#8b5cf6',     F: '#ef4444'  }

export default function TeamDesignTabs(p: TeamDesignProps) {
  const accent = p.homeKitColor ? `#${p.homeKitColor}` : '#e8c23a'
  // Use matchStatRows so hero badges are always tournament-aware (group + knockout)
  const wins   = p.matchStatRows.filter(r => r.result === 'W').length
  const draws  = p.matchStatRows.filter(r => r.result === 'D').length
  const losses = p.matchStatRows.filter(r => r.result === 'L').length

  const byPos: Record<string, RosterPlayer[]> = { G: [], D: [], M: [], F: [] }
  for (const pl of p.roster) {
    const k = pl.position?.toUpperCase()?.[0] ?? 'M'
    const key = k in byPos ? k : 'M'
    byPos[key].push(pl)
  }

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#fff' }}>

      {/* ── Hero Banner ── */}
      <div style={{ background: `linear-gradient(135deg, #0d0d0d 40%, ${accent}22 100%)`, borderBottom: `3px solid ${accent}`, padding: '32px 24px' }}>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <FlagImg country={p.teamName} width={96} cdnSize={160} style={{ borderRadius: 4, boxShadow: `0 0 32px ${accent}55` }} />
            <div>
              <div style={{ fontSize: 11, letterSpacing: 4, color: accent, fontWeight: 700, marginBottom: 4 }}>
                {p.group}{p.groupRank > 0 ? ` · ${ordinal(p.groupRank)} IN GROUP` : ''} · FIFA WORLD CUP 2026
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, letterSpacing: 2, color: '#fff' }}>
                {p.teamName.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                {p.coachName || '—'}{p.coachCountry ? ` · ${p.coachCountry}` : ''}
              </div>
            </div>
          </div>

          {/* W / D / L badges */}
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
      {(p.groupStanding !== null || p.matchStatRows.length > 0) && (() => {
        const gs = p.groupStanding

        // Knockout round detection
        const isKO = (rn: string) =>
          /round of (16|32)|quarter.?final|semi.?final|third place|^final$/i.test(rn ?? '')

        const groupRows  = p.matchStatRows.filter(r => !isKO(r.roundName))
        const koRows     = p.matchStatRows.filter(r =>  isKO(r.roundName))
        const koUpcoming = p.upcomingMatches.filter(m =>  isKO(m.roundName))
        const inKO       = koRows.length > 0 || koUpcoming.length > 0

        // Tournament totals (used when in knockout)
        const tourGF     = p.matchStatRows.reduce((s, r) => s + r.gf, 0)
        const tourGA     = p.matchStatRows.reduce((s, r) => s + r.ga, 0)
        const tourGD     = tourGF - tourGA

        // Display values: group-only in group stage, full tournament in knockout
        const dispGF     = inKO ? tourGF   : (gs?.gf ?? 0)
        const dispGA     = inKO ? tourGA   : (gs?.ga ?? 0)
        const rawGD      = inKO ? tourGD   : (gs?.gd ?? 0)
        const dispGD     = (rawGD >= 0 ? '+' : '') + rawGD
        const dispPlayed = inKO ? p.matchStatRows.length : (gs?.played ?? 0)

        // Position hero (always group rank — permanent historical context)
        const pos = p.groupRank > 0 ? ordinal(p.groupRank) : '—'

        // Stage label for right hero cell during knockout
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

        // Dots: group dots (filled) + empty group upcoming + separator + KO dots + empty KO upcoming
        const groupDots    = groupRows.map(r => ({ c: resultColor(r.result), l: r.result }))
        const groupEmpty   = inKO ? 0 : Math.max(0, 3 - groupRows.length)
        const koDots       = koRows.map(r => ({ c: resultColor(r.result), l: r.result }))
        const koEmptyCount = koUpcoming.length

        const totalPlayed = p.matchStatRows.length
        const totalAll    = totalPlayed + p.upcomingMatches.length

        return (
          <div style={{ borderBottom: '1px solid #1e1e1e', background: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>

              {/* Left hero: Group rank (frozen) + Points or Stage */}
              <div style={{ display: 'flex', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
                <div style={{ padding: '18px 24px', textAlign: 'center', borderRight: '1px solid #1a1a1a' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: accent, lineHeight: 1, fontWeight: 800 }}>{pos}</div>
                  <div style={{ fontSize: 9, color: '#888', letterSpacing: 2, marginTop: 5 }}>
                    {inKO ? 'GROUP FINISH' : 'POSITION'}
                  </div>
                  {p.group && (
                    <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginTop: 3 }}>{p.group.toUpperCase()}</div>
                  )}
                </div>
                <div style={{ padding: '18px 24px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: inKO ? '#fff' : accent, lineHeight: 1, fontWeight: 800 }}>
                    {inKO ? stageShort : (gs?.pts ?? 0)}
                  </div>
                  <div style={{ fontSize: 9, color: inKO ? accent : '#888', letterSpacing: 2, marginTop: 5 }}>
                    {inKO ? 'STAGE' : 'POINTS'}
                  </div>
                </div>
              </div>

              {/* Match progress dots */}
              <div style={{ padding: '16px 36px', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: '#777', letterSpacing: 2, marginBottom: 12 }}>
                  {inKO ? 'WC 2026 JOURNEY' : 'GROUP STAGE'} · {totalPlayed}/{totalAll}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {groupDots.map((d, i) => (
                    <div key={`g${i}`} style={{ width: 36, height: 36, borderRadius: '50%', background: d.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#000', fontWeight: 700 }}>{d.l}</span>
                    </div>
                  ))}
                  {Array(groupEmpty).fill(null).map((_, i) => (
                    <div key={`ge${i}`} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #2a2a2a' }} />
                  ))}
                  {inKO && <div style={{ width: 1, height: 36, background: '#2a2a2a', margin: '0 4px', flexShrink: 0 }} />}
                  {koDots.map((d, i) => (
                    <div key={`k${i}`} style={{ width: 36, height: 36, borderRadius: '50%', background: d.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#000', fontWeight: 700 }}>{d.l}</span>
                    </div>
                  ))}
                  {Array(koEmptyCount).fill(null).map((_, i) => (
                    <div key={`ke${i}`} style={{ width: 36, height: 36, borderRadius: '50%', border: `2px dashed ${accent}55` }} />
                  ))}
                </div>
              </div>

              {/* Secondary stats — GF / GA / GD only (PLAYED shown in dots counter) */}
              <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                {[
                  { l: 'GOALS FOR',     v: dispGF },
                  { l: 'GOALS AGAINST', v: dispGA },
                  { l: 'GOAL DIFF',     v: dispGD },
                ].map(({ l, v }) => (
                  <div key={l} style={{ flex: 1, padding: '18px 10px', textAlign: 'center', borderRight: '1px solid #1a1a1a' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#888', lineHeight: 1, fontWeight: 700 }}>{v}</div>
                    <div style={{ fontSize: 9, color: '#666', letterSpacing: 2, marginTop: 6 }}>{l}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── WC 2026 PERFORMANCE TABLE (full-width) ── */}
      {p.matchStatRows.length > 0 && (
        <div style={{ background: '#0d0d0d', borderTop: `3px solid ${accent}`, borderBottom: `3px solid ${accent}`, padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 3, color: accent, marginBottom: 16 }}>WC 2026 PERFORMANCE</div>
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
                {p.matchStatRows.map(row => {
                  const rc  = row.result === 'W' ? '#22c55e' : row.result === 'L' ? '#ef4444' : '#f59e0b'
                  const fmt = (v: number | null, decimals = 0) => v === null ? '—' : decimals ? v.toFixed(decimals) : String(v)
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
                            <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, marginTop: 4, width: 40, margin: '4px auto 0' }}>
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
          <div style={{ fontSize: 9, color: '#666', marginTop: 12, letterSpacing: 1 }}>
            POSS = Possession · ON TGT = Shots on Target · xG = Expected Goals · YC = Yellow Cards · RC = Red Cards · PASS% = Pass Accuracy · CHANCES = Big Chances
          </div>
        </div>
      )}

      {/* ── Body: Squad (left) + Venue / Stats (right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a1a1a' }} className="max-md:grid-cols-1">

        {/* Squad */}
        <div style={{ background: '#0d0d0d', padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 3, color: accent, marginBottom: 20 }}>SQUAD</div>
          {(['G', 'D', 'M', 'F'] as const).map(pos => {
            const players = byPos[pos] ?? []
            if (!players.length) return null
            return (
              <div key={pos} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 14, background: POS_COLOR[pos], borderRadius: 2 }} />
                  <span style={{ fontSize: 9, letterSpacing: 3, color: POS_COLOR[pos] }}>{POS_LABELS[pos]}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {players
                    .sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
                    .map(pl => (
                      <Link
                        key={pl.id}
                        href={`/players/${pl.id}`}
                        style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', minWidth: 120, display: 'block', textDecoration: 'none' }}
                      >
                        {pl.imageUrl && (
                          <img
                            src={pl.imageUrl}
                            alt={pl.name}
                            width={48}
                            height={48}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', marginBottom: 4, border: '1px solid #2a2a2a' }}
                          />
                        )}
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#666', lineHeight: 1 }}>{pl.jerseyNumber ?? '—'}</div>
                        <div style={{ fontSize: 12, color: '#fff', marginTop: 2, fontWeight: 500 }}>{pl.name}</div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{pl.specificPosition} · {pl.age}y</div>
                      </Link>
                    ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div style={{ background: '#0d0d0d', padding: 24 }}>

          {/* Upcoming fixtures */}
          {p.upcomingMatches.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 3, color: accent, marginBottom: 12 }}>UPCOMING FIXTURES</div>
              {p.upcomingMatches.map(m => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #1a1a1a', textDecoration: 'none' }}
                >
                  <div style={{ flexShrink: 0, width: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{m.date}</div>
                    <div style={{ fontSize: 9, color: '#555' }}>{m.time}</div>
                  </div>
                  <FlagImg country={m.opponent} width={18} cdnSize={40} style={{ borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#ccc', fontWeight: 500 }}>{m.isHome ? 'vs' : '@'} {m.opponent}</div>
                    {(m.venueName || m.venueCity) && (
                      <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                        {[m.venueName, m.venueCity].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  {m.roundName && <div style={{ fontSize: 9, color: '#777', textAlign: 'right', maxWidth: 80 }}>{m.roundName}</div>}
                  <div style={{ fontSize: 10, color: accent, flexShrink: 0 }}>→</div>
                </Link>
              ))}
            </div>
          )}

          {/* Venue */}
          {p.venueInfo && (
            <div style={{ background: '#111', border: `1px solid ${accent}33`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 3, color: accent, marginBottom: 12 }}>WC 2026 VENUE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff', marginBottom: 4 }}>
                {p.venueInfo.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>{p.venueInfo.city}, {p.venueInfo.country}</div>
              <div style={{ fontSize: 11, color: accent, marginTop: 8 }}>CAP. {p.venueInfo.capacity.toLocaleString()}</div>
            </div>
          )}

          {/* Player stats */}
          {p.statLeaders.length > 0 && (
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: accent, marginBottom: 12 }}>PLAYER STATS</div>
              {p.statLeaders.slice(0, 8).map(pl => (
                <div key={pl.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{pl.name}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>{pl.pos}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {([
                      { label: 'G',   value: String(pl.goals   || '0'), color: accent },
                      { label: 'A',   value: String(pl.assists  || '0'), color: '#fff' },
                      { label: 'RTG', value: pl.avgRating,               color: '#aaa' },
                    ]).map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 8, color: '#777', letterSpacing: 1 }}>{label}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {pl.yellow > 0 && <span style={{ display: 'inline-block', width: 9, height: 12, background: '#facc15', borderRadius: 1 }} />}
                      {pl.red    > 0 && <span style={{ display: 'inline-block', width: 9, height: 12, background: '#ef4444', borderRadius: 1 }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
