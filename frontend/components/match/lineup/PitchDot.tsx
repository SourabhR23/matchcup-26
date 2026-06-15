'use client'

import type { PlayerFlags, MatchupPlayerSlim } from '../types'
import { playerFlags } from './pitchUtils'

export function GoalBallG({ cx, cy, r, color, isPenalty }: { cx: number; cy: number; r: number; color: string; isPenalty: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx - r*0.18} cy={cy - r*0.22} r={r*0.40} fill="rgba(0,0,0,0.30)" />
      <circle cx={cx + r*0.42} cy={cy - r*0.38} r={r*0.18} fill="rgba(0,0,0,0.22)" />
      <circle cx={cx + r*0.48} cy={cy + r*0.32} r={r*0.18} fill="rgba(0,0,0,0.22)" />
      <circle cx={cx - r*0.42} cy={cy + r*0.42} r={r*0.18} fill="rgba(0,0,0,0.22)" />
      {isPenalty && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={r*1.1} fontWeight="800" fill="rgba(255,255,255,0.95)">P</text>}
    </g>
  )
}

export function GoalBall({ size = 13, color = '#444', isPenalty = false }: { size?: number; color?: string; isPenalty?: boolean }) {
  const r = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <GoalBallG cx={r} cy={r} r={r - 0.5} color={color} isPenalty={isPenalty} />
    </svg>
  )
}

export function PitchDot({ player, cx, cy, isHome, flags }: {
  player: MatchupPlayerSlim; cx: number; cy: number; isHome: boolean; flags: PlayerFlags
}) {
  const f  = playerFlags(player, flags)
  const R  = 7
  const tc = isHome ? 'var(--color-accent)' : '#d4d4d4'
  const short = (() => {
    const s = player.short_name ?? player.name
    const p = s.trim().split(/\s+/)
    return (p.length > 1 ? p[p.length - 1] : s).slice(0, 9)
  })()
  const clipId = `cp-${player.id}`
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill="#0f1f0f" stroke={tc} strokeWidth={1.5} />
      {player.image_url ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={cy} r={R - 0.8} />
            </clipPath>
          </defs>
          <image
            href={player.image_url}
            x={cx - R} y={cy - R}
            width={R * 2} height={R * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <text x={cx} y={cy + 2.2} textAnchor="middle" fontSize={6} fontWeight="bold" fill={tc} dominantBaseline="middle">
          {player.jersey_number ?? ''}
        </text>
      )}

      {(f as {subOut?:number}).subOut !== undefined && (
        <text x={cx - R + 2} y={cy - R + 4} textAnchor="middle" fontSize={6} fill="#ff5555">▼</text>
      )}
      {f.yellow && !f.red && (
        <rect x={cx + R - 3} y={cy - R - 4} width={4} height={5.5} fill="#f5c518" rx={0.4} />
      )}
      {f.red && (
        <rect x={cx + R - 3} y={cy - R - 4} width={4} height={5.5} fill="#cc2200" rx={0.4} />
      )}
      <text x={cx} y={cy + R + 5} textAnchor="middle" fontSize={4.5} fontWeight={isHome ? 'bold' : 'normal'} fill={tc} opacity={0.85}>
        {f.goals > 0 ? (isHome ? `⚽ ${short}` : `${short} ⚽`) : short}
      </text>
    </g>
  )
}
