import type { CSSProperties } from 'react'
import type { Incident } from '@/lib/types'

/* ── Flexible player shape (handles BSD API + lineups.json) ─── */
export interface LineupPlayerRaw {
  id?: number
  name?: string
  player_name?: string   // BSD API alt field
  short_name?: string
  position?: string
  jersey_number?: number
}

export interface LineupTeamData {
  formation?: string | null
  players:     LineupPlayerRaw[]
  substitutes: LineupPlayerRaw[]
}

export interface LineupData {
  home: LineupTeamData
  away: LineupTeamData
}

/* ── Normalize one player to display shape ─────────────────── */
function norm(p: LineupPlayerRaw) {
  return {
    id:      p.id ?? 0,
    name:    p.name ?? p.player_name ?? '',
    display: p.short_name ?? p.name ?? p.player_name ?? '',
    pos:     (p.position ?? 'M').toUpperCase(),
    jersey:  p.jersey_number ?? 0,
  }
}

/* ── Build per-player flags from incidents ─────────────────── */
type Flags = Map<string, { yellow: boolean; red: boolean; subIn?: number; subOut?: number; goals: number }>

function buildFlags(incidents: Incident[]): Flags {
  const map: Flags = new Map()
  const get = (name: string) => {
    if (!name) return { yellow: false, red: false, goals: 0 }
    if (!map.has(name)) map.set(name, { yellow: false, red: false, goals: 0 })
    return map.get(name)!
  }
  for (const inc of incidents) {
    if (inc.type === 'card' && inc.player) {
      const f = get(inc.player)
      if (inc.card_type === 'yellow') f.yellow = true
      if (inc.card_type === 'red')    f.red    = true
    }
    if (inc.type === 'goal' && inc.player) get(inc.player).goals++
    if (inc.type === 'substitution') {
      if (inc.player_in)  get(inc.player_in).subIn   = inc.minute
      if (inc.player_out) get(inc.player_out).subOut = inc.minute
    }
  }
  return map
}

/* ── Position badge colour ─────────────────────────────────── */
const POS_BG: Record<string, string> = { G: '#7c4a00', D: '#1a6b2e', M: '#1a3f6b', F: '#6b1a1a' }

/* ── Single player row ─────────────────────────────────────── */
function PlayerRow({ p, flags, isAway }: { p: LineupPlayerRaw; flags: Flags; isAway?: boolean }) {
  const { display, pos, jersey, name } = norm(p)
  const f = flags.get(name) ?? flags.get(display) ?? { yellow: false, red: false, goals: 0 }
  const bg = POS_BG[pos] ?? '#333'

  const posBadge = (
    <span style={{
      fontSize: 8, fontWeight: 700, color: '#fff',
      background: bg, padding: '2px 5px', borderRadius: 2,
      minWidth: 16, textAlign: 'center', flexShrink: 0,
    }}>{pos}</span>
  )

  const cardBadges = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      {f.goals > 0 && Array.from({ length: Math.min(f.goals, 3) }).map((_, i) => (
        <span key={i} style={{ fontSize: 10 }}>⚽</span>
      ))}
      {f.yellow && <span style={{ display: 'inline-block', width: 8, height: 11, background: 'var(--color-warning)', borderRadius: 1 }} />}
      {f.red    && <span style={{ display: 'inline-block', width: 8, height: 11, background: '#cc0000', borderRadius: 1 }} />}
    </span>
  )

  const subTag = f.subOut
    ? <span style={{ fontSize: 9, color: '#cc0000', flexShrink: 0 }}>↓{f.subOut}&apos;</span>
    : f.subIn
    ? <span style={{ fontSize: 9, color: '#22a060', flexShrink: 0 }}>↑{f.subIn}&apos;</span>
    : null

  const row: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 0', borderBottom: '0.5px solid #e8e2d8',
  }

  if (isAway) {
    return (
      <div style={{ ...row, justifyContent: 'flex-end' }}>
        {subTag}
        {cardBadges}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: '#111', fontWeight: 500 }}>{display}</span>
          {jersey > 0 && <span style={{ fontSize: 9, color: '#bbb', marginLeft: 3 }}>#{jersey}</span>}
        </div>
        {posBadge}
      </div>
    )
  }

  return (
    <div style={row}>
      {posBadge}
      {jersey > 0 && <span style={{ fontSize: 9, color: '#bbb' }}>#{jersey}</span>}
      <span style={{ fontSize: 11, color: '#111', fontWeight: 500, flex: 1 }}>{display}</span>
      {cardBadges}
      {subTag}
    </div>
  )
}

/* ── Team label ────────────────────────────────────────────── */
function TeamLabel({ name, formation, right }: { name: string; formation?: string | null; right?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 5, marginBottom: 8 }}>
      {right && formation && <span style={{ fontSize: 9, color: '#999' }}>{formation}</span>}
      <span style={{ fontSize: 9, fontWeight: 700, color: '#f5f0e8', background: '#111', padding: '2px 7px', letterSpacing: 1 }}>
        {name.toUpperCase()}
      </span>
      {!right && formation && <span style={{ fontSize: 9, color: '#999' }}>{formation}</span>}
    </div>
  )
}

/* ── Main exported component ───────────────────────────────── */
export default function LineupSection({
  lineups, incidents, homeTeam, awayTeam,
}: {
  lineups:   LineupData
  incidents: Incident[]
  homeTeam:  string
  awayTeam:  string
}) {
  const flags    = buildFlags(incidents)
  const colLabel: CSSProperties = {
    fontSize: 9, letterSpacing: 3, color: '#999',
    borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 14,
  }
  const innerGrid: CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px',
  }

  return (
    <div style={{ background: '#f5f0e8', borderTop: '1px solid #ddd8cc', paddingTop: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 0 }}>

        {/* STARTING XI */}
        <div style={{ padding: 20, borderRight: '1px solid #ddd8cc' }}>
          <div style={colLabel}>STARTING XI</div>
          <div style={innerGrid}>
            <div>
              <TeamLabel name={homeTeam} formation={lineups.home.formation} />
              {lineups.home.players.map((p, i) => (
                <PlayerRow key={p.id ?? i} p={p} flags={flags} />
              ))}
            </div>
            <div>
              <TeamLabel name={awayTeam} formation={lineups.away.formation} right />
              {lineups.away.players.map((p, i) => (
                <PlayerRow key={p.id ?? i} p={p} flags={flags} isAway />
              ))}
            </div>
          </div>
        </div>

        {/* BENCH */}
        <div style={{ padding: 20 }}>
          <div style={colLabel}>BENCH</div>
          <div style={innerGrid}>
            <div>
              <TeamLabel name={homeTeam} />
              {lineups.home.substitutes.map((p, i) => (
                <PlayerRow key={p.id ?? i} p={p} flags={flags} />
              ))}
            </div>
            <div>
              <TeamLabel name={awayTeam} right />
              {lineups.away.substitutes.map((p, i) => (
                <PlayerRow key={p.id ?? i} p={p} flags={flags} isAway />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
