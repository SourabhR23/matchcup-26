import FlagImg from './FlagImg'
import Link from 'next/link'
import type { MatchEvent } from '@/lib/types'

const ROUND_ORDER: Record<string, number> = {
  'Round of 32':    1,
  'Round of 16':    2,
  'Quarter-Final':  3,
  'Semi-Final':     4,
  '3rd Place':      5,
  'Final':          6,
}

function roundLabel(name: string) {
  const map: Record<string, string> = {
    'Round of 32':   'R32',
    'Round of 16':   'R16',
    'Quarter-Final': 'QF',
    'Semi-Final':    'SF',
    '3rd Place':     '3RD',
    'Final':         'FINAL',
  }
  return map[name] ?? name.toUpperCase()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface MatchSlotProps {
  match: MatchEvent
}

function MatchSlot({ match }: MatchSlotProps) {
  const done = match.status === 'finished'
  const live = match.status === 'live' || match.status === 'inprogress'
  const homeWon = done && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
  const awayWon = done && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score

  return (
    <Link
      href={done || live ? `/matches/${match.id}` : '#'}
      style={{
        display: 'block',
        background: 'var(--color-surface)',
        border: live ? '0.5px solid var(--color-accent)' : '0.5px solid #ddd8cc',
        textDecoration: 'none',
        color: 'var(--color-ink)',
        minWidth: 180,
        position: 'relative',
      }}
    >
      {live && (
        <span style={{
          position: 'absolute', top: 3, right: 6,
          fontSize: 8, color: 'var(--color-accent)', fontFamily: 'var(--font-bebas, sans-serif)',
          letterSpacing: 1,
        }}>LIVE</span>
      )}
      {[
        { name: match.home_team, score: match.home_score, won: homeWon },
        { name: match.away_team, score: match.away_score, won: awayWon },
      ].map((side, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px',
          borderBottom: i === 0 ? '0.5px solid #f0ece4' : undefined,
          opacity: done && !side.won ? 0.5 : 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <FlagImg country={side.name} width={16} />
            <span style={{
              fontSize: 11, fontWeight: side.won ? 700 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{side.name || '?'}</span>
          </div>
          {side.score !== null && (
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'right', marginLeft: 6 }}>
              {side.score}
            </span>
          )}
        </div>
      ))}
      <div style={{ padding: '2px 8px 4px', fontSize: 9, color: '#999', letterSpacing: 0.5 }}>
        {formatDate(match.event_date)}
      </div>
    </Link>
  )
}

interface Props {
  matches: MatchEvent[]
}

export default function KnockoutBracket({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <div style={{
        marginTop: 32, background: 'var(--color-surface)', border: '0.5px solid #ddd8cc',
        padding: '48px 24px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 28,
          letterSpacing: 3, marginBottom: 8, color: 'var(--color-ink)',
        }}>KNOCKOUT STAGE</div>
        <p style={{ fontSize: 12, color: '#999', letterSpacing: 0.5, marginBottom: 0 }}>
          Bracket will be set once the group stage concludes.
        </p>
      </div>
    )
  }

  // Group matches by round
  const byRound: Record<string, MatchEvent[]> = {}
  for (const m of matches) {
    const r = m.round_name || 'Unknown'
    if (!byRound[r]) byRound[r] = []
    byRound[r].push(m)
  }

  const rounds = Object.entries(byRound).sort(
    ([a], [b]) => (ROUND_ORDER[a] ?? 99) - (ROUND_ORDER[b] ?? 99)
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 0, minWidth: 'max-content', alignItems: 'flex-start' }}>
        {rounds.map(([roundName, roundMatches], ri) => (
          <div key={roundName} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Round header */}
            <div style={{
              background: '#111', padding: '6px 16px', textAlign: 'center',
              borderRight: ri < rounds.length - 1 ? '0.5px solid #333' : undefined,
            }}>
              <span style={{
                fontFamily: 'var(--font-bebas, sans-serif)', color: 'var(--color-accent)',
                fontSize: 16, letterSpacing: 2,
              }}>{roundLabel(roundName)}</span>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>
                {roundName !== roundLabel(roundName) ? roundName.toUpperCase() : ''}
              </div>
            </div>

            {/* Match slots distributed evenly */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-around',
              gap: 8,
              padding: '12px 8px',
              borderRight: ri < rounds.length - 1 ? '0.5px solid #e8e2d8' : undefined,
              minHeight: 120,
            }}>
              {roundMatches.map(m => (
                <MatchSlot key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
