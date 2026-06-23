import type { TournamentFacts } from '@/lib/data'

const FACTS = [
  { key: 'goals' as const,        label: 'Goals',        icon: '⚽' },
  { key: 'yellow_cards' as const, label: 'Yellow Cards', icon: '🟨' },
  { key: 'red_cards' as const,    label: 'Red Cards',    icon: '🟥' },
]

export default function TournamentFactsBar({ facts }: { facts: TournamentFacts }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FACTS.map(({ key, label, icon }) => (
        <div
          key={key}
          className="flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-3.5 sm:py-2.5"
          style={{
            background: '#fff',
            border: '0.5px solid #e8e2d8',
            borderLeft: '3px solid var(--color-accent)',
          }}
        >
          <span className="text-base sm:text-xl leading-none shrink-0">{icon}</span>
          <div className="min-w-0">
            <div
              className="font-display leading-none text-2xl sm:text-3xl"
              style={{ color: 'var(--color-accent)', letterSpacing: 1 }}
            >
              {facts[key]}
            </div>
            <div className="text-[7px] sm:text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#888' }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
