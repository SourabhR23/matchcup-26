'use client'

import type { PlayerMatchHistoryRow } from '@/lib/data'

function ratingColor(r: number): string {
  if (r >= 8) return '#22c55e'
  if (r >= 7) return '#f59e0b'
  if (r >= 6) return '#aaa'
  return '#ef4444'
}

function shortDate(d: string | null, idx: number): string {
  if (!d) return `M${idx + 1}`
  const dt = new Date(d)
  return `${dt.toLocaleString('en-US', { month: 'short' })} ${dt.getDate()}`
}

function RatingChart({ rows }: { rows: PlayerMatchHistoryRow[] }) {
  const points = [...rows].reverse().filter(r => r.rating != null)
  if (!points.length) return null

  const H = 110
  const LABEL_H = 22
  const BAR_W = 32
  const GAP = 8
  const PAD = 4
  const totalW = PAD + points.length * (BAR_W + GAP)

  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>
        Rating Per Match
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={Math.max(totalW, 200)} height={H + LABEL_H} style={{ display: 'block' }}>
          <line x1={0} y1={H} x2={totalW} y2={H} stroke="#e8e2d8" strokeWidth={1} />
          {points.map((p, i) => {
            const x = PAD + i * (BAR_W + GAP)
            const barH = Math.max(3, (p.rating! / 10) * H)
            const y = H - barH
            const col = ratingColor(p.rating!)
            return (
              <g key={p.event_id}>
                <rect x={x} y={y} width={BAR_W} height={barH} fill={col} rx={2} opacity={0.85} />
                <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={8} fill={col} fontWeight="700">
                  {p.rating!.toFixed(1)}
                </text>
                <text x={x + BAR_W / 2} y={H + 15} textAnchor="middle" fontSize={7} fill="#999">
                  {shortDate(p.event_date, i)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function GoalsXgChart({ rows }: { rows: PlayerMatchHistoryRow[] }) {
  const points = [...rows]
    .reverse()
    .filter(r => (r.goals ?? 0) > 0 || (r.expected_goals ?? 0) > 0)
  if (!points.length) return null

  const H = 110
  const LABEL_H = 22
  const G_W = 18
  const XG_W = 18
  const PAIR_GAP = 3
  const MATCH_GAP = 10
  const PAD = 4
  const SLOT_W = G_W + PAIR_GAP + XG_W + MATCH_GAP
  const totalW = PAD + points.length * SLOT_W
  const maxVal = Math.max(1, ...points.map(p => Math.max(p.goals ?? 0, p.expected_goals ?? 0)))

  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>
        Goals vs xG
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        {[
          { label: 'Goals', opacity: 1 },
          { label: 'xG',    opacity: 0.3 },
        ].map(({ label, opacity }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-accent)', opacity }} />
            <span style={{ fontSize: 8, color: '#888' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={Math.max(totalW, 200)} height={H + LABEL_H} style={{ display: 'block' }}>
          <line x1={0} y1={H} x2={totalW} y2={H} stroke="#e8e2d8" strokeWidth={1} />
          {points.map((p, i) => {
            const x = PAD + i * SLOT_W
            const gH  = Math.max((p.goals ?? 0) > 0 ? 3 : 0, ((p.goals ?? 0) / maxVal) * H)
            const xgH = Math.max((p.expected_goals ?? 0) > 0 ? 2 : 0, ((p.expected_goals ?? 0) / maxVal) * H)
            return (
              <g key={p.event_id}>
                <rect x={x} y={H - gH} width={G_W} height={gH} fill="var(--color-accent)" rx={2} />
                <rect x={x + G_W + PAIR_GAP} y={H - xgH} width={XG_W} height={xgH} fill="var(--color-accent)" opacity={0.3} rx={2} />
                {(p.goals ?? 0) > 0 && (
                  <text x={x + G_W / 2} y={H - gH - 4} textAnchor="middle" fontSize={8} fill="var(--color-accent)" fontWeight="700">
                    {p.goals}
                  </text>
                )}
                <text x={x + (G_W + PAIR_GAP + XG_W) / 2} y={H + 15} textAnchor="middle" fontSize={7} fill="#999">
                  {shortDate(p.event_date, i)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// Renders chart content only — outer container and title are provided by the parent page
export default function PlayerCharts({ rows }: { rows: PlayerMatchHistoryRow[] }) {
  const hasRatings = rows.some(r => r.rating != null)
  const hasGoalsXg = rows.some(r => (r.goals ?? 0) > 0 || (r.expected_goals ?? 0) > 0)
  if (!hasRatings && !hasGoalsXg) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {hasRatings && <RatingChart rows={rows} />}
      {hasGoalsXg && <GoalsXgChart rows={rows} />}
    </div>
  )
}
