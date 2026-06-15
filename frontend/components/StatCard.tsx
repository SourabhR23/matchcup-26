interface StatCardProps {
  value: string | number
  label: string
  accent?: boolean
}

export default function StatCard({ value, label, accent = false }: StatCardProps) {
  return (
    <div className={`border border-ink p-5 flex flex-col gap-1 ${accent ? 'bg-accent' : 'bg-surface'}`}>
      <span
        className="font-display leading-none"
        style={{ fontSize: 48, color: accent ? '#111' : 'var(--color-accent)', lineHeight: 1 }}
      >
        {value}
      </span>
      <span className="text-[11px] tracking-[1.5px] uppercase" style={{ color: accent ? '#333' : 'var(--color-ink-muted)' }}>
        {label}
      </span>
    </div>
  )
}
