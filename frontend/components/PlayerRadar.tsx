'use client'

import type { PlayerRadarData } from '@/lib/data'

const CX = 150, CY = 150, R = 88, LABEL_R = 118

function angle(i: number, n: number) {
  return (i * 2 * Math.PI / n) - Math.PI / 2
}

function polyPoints(vals: number[], r: number, n: number): string {
  return vals.map((v, i) => {
    const a = angle(i, n)
    const rr = Math.max(0, (v / 100) * r)
    return `${(CX + rr * Math.cos(a)).toFixed(2)},${(CY + rr * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

function gridPoints(n: number, pct: number): string {
  const rr = (pct / 100) * R
  return Array.from({ length: n }, (_, i) => {
    const a = angle(i, n)
    return `${(CX + rr * Math.cos(a)).toFixed(2)},${(CY + rr * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

function textAnchor(a: number): 'start' | 'end' | 'middle' {
  const c = Math.cos(a)
  if (c > 0.25) return 'start'
  if (c < -0.25) return 'end'
  return 'middle'
}

export default function PlayerRadar({ data }: { data: PlayerRadarData }) {
  const { axes, values } = data
  const N = axes.length
  if (N < 3) return null

  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>
        vs Position Peers (Percentile)
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 280, display: 'block' }}>

          {/* Grid polygons */}
          {[25, 50, 75, 100].map(lvl => (
            <polygon
              key={lvl}
              points={gridPoints(N, lvl)}
              fill="none"
              stroke={lvl === 100 ? '#d8d4cc' : '#eeebe5'}
              strokeWidth={lvl === 100 ? 1 : 0.6}
            />
          ))}

          {/* Axis spokes */}
          {Array.from({ length: N }, (_, i) => {
            const a = angle(i, N)
            return (
              <line key={i}
                x1={CX} y1={CY}
                x2={(CX + R * Math.cos(a)).toFixed(2)}
                y2={(CY + R * Math.sin(a)).toFixed(2)}
                stroke="#e0dcd4" strokeWidth={0.6}
              />
            )
          })}

          {/* Player fill */}
          <polygon
            points={polyPoints(values, R, N)}
            fill="var(--color-accent)"
            fillOpacity={0.15}
            stroke="var(--color-accent)"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />

          {/* Vertex dots */}
          {values.map((v, i) => {
            const a = angle(i, N)
            const rr = (v / 100) * R
            return (
              <circle key={i}
                cx={(CX + rr * Math.cos(a)).toFixed(2)}
                cy={(CY + rr * Math.sin(a)).toFixed(2)}
                r={3.5} fill="var(--color-accent)"
              />
            )
          })}

          {/* Labels */}
          {axes.map((label, i) => {
            const a = angle(i, N)
            const lx = CX + LABEL_R * Math.cos(a)
            const ly = CY + LABEL_R * Math.sin(a)
            const anchor = textAnchor(a)
            const pct = values[i]
            return (
              <g key={i}>
                <text x={lx.toFixed(1)} y={(ly - 5).toFixed(1)}
                  textAnchor={anchor} fontSize={7.5} fill="#555" fontWeight="600">
                  {label}
                </text>
                <text x={lx.toFixed(1)} y={(ly + 7).toFixed(1)}
                  textAnchor={anchor} fontSize={7} fill="var(--color-accent)" fontWeight="700">
                  {pct}th %ile
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
