import FlagImg from './FlagImg'
import type { MiniPlayerStat } from '@/lib/data'

interface Props {
  topRated:   MiniPlayerStat[]
  topScorers: MiniPlayerStat[]
  topAssists: MiniPlayerStat[]
}

const COLUMNS = [
  { key: 'topRated'   as const, label: 'TOP RATED',   format: (v: number) => v.toFixed(2) },
  { key: 'topScorers' as const, label: 'TOP SCORERS',  format: (v: number) => String(v) },
  { key: 'topAssists' as const, label: 'TOP ASSISTS',  format: (v: number) => String(v) },
]

function PlayerRow({ player, rank, format }: { player: MiniPlayerStat; rank: number; format: (v: number) => string }) {
  const initials = player.short_name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderBottom: '1px solid #181818',
    }}>
      {/* Rank */}
      <span style={{ fontSize: 12, color: rank <= 1 ? 'var(--color-accent)' : '#444', fontWeight: 700, width: 16, flexShrink: 0 }}>
        {rank}
      </span>

      {/* Photo */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: '#1e1e1e',
        border: '1px solid #2a2a2a', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {player.image_url
          ? <img src={player.image_url} width={36} height={36} alt={player.short_name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          : <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{initials}</span>
        }
      </div>

      {/* Name + team */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e4dc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.short_name}
        </div>
        {player.team_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <FlagImg country={player.team_name} width={14} />
            <span style={{ fontSize: 10, color: '#555', letterSpacing: 0.5 }}>{player.team_name}</span>
          </div>
        )}
      </div>

      {/* Stat value */}
      <span style={{
        fontSize: 16, fontWeight: 900, color: '#f5f0e8',
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {format(player.value)}
      </span>
    </div>
  )
}

function LeaderColumn({ label, players, format }: { label: string; players: MiniPlayerStat[]; format: (v: number) => string }) {
  if (!players.length) return null
  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #222' }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: '#888', fontWeight: 700 }}>{label}</span>
      </div>
      {players.map((p, i) => (
        <PlayerRow key={p.player_id} player={p} rank={i + 1} format={format} />
      ))}
    </div>
  )
}

export default function MiniLeaderboards({ topRated, topScorers, topAssists }: Props) {
  const data = { topRated, topScorers, topAssists }
  const hasAny = topRated.length > 0 || topScorers.length > 0 || topAssists.length > 0
  if (!hasAny) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      {COLUMNS.map(col => (
        <LeaderColumn key={col.key} label={col.label} players={data[col.key]} format={col.format} />
      ))}
    </div>
  )
}
