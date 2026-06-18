import type { TournamentFacts } from '@/lib/data'

const FACTS = [
  { key: 'goals' as const,        label: 'Goals',        icon: '⚽' },
  { key: 'yellow_cards' as const, label: 'Yellow Cards', icon: '🟨' },
  { key: 'red_cards' as const,    label: 'Red Cards',    icon: '🟥' },
]

export default function TournamentFactsBar({ facts }: { facts: TournamentFacts }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {FACTS.map(({ key, label, icon }) => (
        <div
          key={key}
          style={{
            background: '#fff',
            border: '0.5px solid #e8e2d8',
            borderLeft: '3px solid var(--color-accent)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-bebas, sans-serif)',
                fontSize: 30,
                lineHeight: 1,
                color: 'var(--color-accent)',
                letterSpacing: 1,
              }}
            >
              {facts[key]}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginTop: 2 }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
