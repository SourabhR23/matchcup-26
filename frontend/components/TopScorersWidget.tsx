import Link from 'next/link'
import FlagImg from './FlagImg'
import type { TopScorer } from '@/lib/data'

interface Props {
  scorers: TopScorer[]
}

export default function TopScorersWidget({ scorers }: Props) {
  if (!scorers.length) return null

  return (
    <div>
      {/* Section head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #111', paddingBottom: 6, marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 28, letterSpacing: 2, color: '#111', margin: 0 }}>
          TOP SCORERS
        </h2>
        <span style={{ fontSize: 9, color: '#aaa', letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
          FIFA WORLD CUP 2026
        </span>
      </div>

      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 36px 36px', padding: '7px 14px', borderBottom: '1px solid #222' }}>
          {['#', 'PLAYER', 'G', 'A', 'PEN'].map((h, i) => (
            <span key={h} style={{
              fontSize: 8, letterSpacing: 2, color: '#555', fontWeight: 700,
              textAlign: i === 1 ? 'left' : 'center',
            }}>{h}</span>
          ))}
        </div>

        {scorers.map((p, i) => {
          const name = p.short_name || p.player_name || `#${p.player_id}`
          const initials = (p.player_name ?? name).trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div key={p.player_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 36px 36px 36px',
                padding: '8px 14px',
                borderBottom: i < scorers.length - 1 ? '1px solid #181818' : 'none',
                alignItems: 'center',
              }}
            >
              {/* Rank */}
              <span style={{ fontSize: 11, color: i < 3 ? 'var(--color-accent)' : '#444', fontWeight: 700 }}>
                {i + 1}
              </span>

              {/* Player */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#1e1e1e',
                  border: '1px solid #2a2a2a', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {p.image_url
                    ? <img src={p.image_url} width={28} height={28} alt={name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    : <span style={{ fontSize: 8, fontWeight: 700, color: '#555' }}>{initials}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e4dc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                  {p.team_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <FlagImg country={p.team_name} width={14} />
                      <span style={{ fontSize: 9, color: '#555', letterSpacing: 0.5 }}>{p.team_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals */}
              <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#f5f0e8', fontVariantNumeric: 'tabular-nums' }}>
                {p.goals}
              </span>

              {/* Assists */}
              <span style={{ textAlign: 'center', fontSize: 12, color: p.assists > 0 ? '#aaa' : '#333', fontVariantNumeric: 'tabular-nums' }}>
                {p.assists}
              </span>

              {/* Penalties */}
              <span style={{ textAlign: 'center', fontSize: 12, color: p.penalties > 0 ? '#777' : '#2a2a2a', fontVariantNumeric: 'tabular-nums' }}>
                {p.penalties > 0 ? p.penalties : '—'}
              </span>
            </div>
          )
        })}

        {/* Footer */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #1e1e1e' }}>
          <span style={{ fontSize: 8, color: '#333', letterSpacing: 1.5 }}>G = GOALS · A = ASSISTS · PEN = PENALTIES</span>
        </div>
      </div>
    </div>
  )
}
