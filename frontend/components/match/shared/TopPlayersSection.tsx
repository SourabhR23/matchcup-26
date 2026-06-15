'use client'

import styles from './TopPlayersSection.module.css'
import type { TopPlayer } from '../types'

export default function TopPlayersSection({ topPlayers, homeTeam, awayTeam, playerImageMap }: {
  topPlayers: TopPlayer[]; homeTeam: string; awayTeam: string
  playerImageMap?: Map<string, string>
}) {
  const home = topPlayers.filter(p => p.team === homeTeam).slice(0, 3)
  const away = topPlayers.filter(p => p.team === awayTeam).slice(0, 3)
  if (home.length === 0 && away.length === 0) return null

  const ratingBg = (r: number) =>
    r >= 8.0 ? '#16a34a' : r >= 7.5 ? '#2563eb' : r >= 7.0 ? '#6b7280' : '#9ca3af'

  const Card = ({ p }: { p: TopPlayer }) => {
    const imgUrl = playerImageMap?.get(p.name)
    const initials = p.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0ece4' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#e8e2d8', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {imgUrl
            ? <img src={imgUrl} width={36} height={36} alt={p.name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>{initials}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </div>
          <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1 }}>
            {p.pos}{p.goals > 0 ? ` · ⚽ ${p.goals}` : ''}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 4, background: ratingBg(p.rating), flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {p.rating.toFixed(1)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: '#111', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 14 }}>
        TOP PLAYERS
      </div>
      <div className={styles.grid}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.5, marginBottom: 8 }}>{homeTeam.toUpperCase()}</div>
          {home.map((p, i) => <Card key={i} p={p} />)}
          {home.length === 0 && <div style={{ fontSize: 10, color: '#ccc' }}>No data</div>}
        </div>
        <div className={styles.divider} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.5, marginBottom: 8 }}>{awayTeam.toUpperCase()}</div>
          {away.map((p, i) => <Card key={i} p={p} />)}
          {away.length === 0 && <div style={{ fontSize: 10, color: '#ccc' }}>No data</div>}
        </div>
      </div>
    </div>
  )
}
