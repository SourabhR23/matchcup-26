'use client'

import { useState, useMemo } from 'react'
import type { ShotmapEntry, XgMinuteEntry, AvgPosition } from '@/lib/types'
import { GoalBallG } from '../lineup/PitchDot'

/* Possession Bar */
export function PossessionBar({ home, away, homeTeam, awayTeam }: {
  home: number; away: number; homeTeam: string; awayTeam: string
}) {
  return (
    <div style={{ padding: '20px 0 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {home}%
        </span>
        <span style={{ fontSize: 9, letterSpacing: 3, color: '#666' }}>POSSESSION</span>
        <span style={{ fontSize: 36, color: '#c8c8c8', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {away}%
        </span>
      </div>
      <div style={{ height: 8, background: '#1e1e1e', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        <div className="bar-anim" style={{ width: `${home}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: 1, height: '100%', background: '#5a5a5a', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 9, color: 'var(--color-accent)', letterSpacing: 1.5 }}>{homeTeam.toUpperCase()}</span>
        <span style={{ fontSize: 9, color: '#c8c8c8', letterSpacing: 1.5, opacity: 0.7 }}>{awayTeam.toUpperCase()}</span>
      </div>
    </div>
  )
}

/* Shot Map — interactive */
export function ShotmapViz({ shots, homeTeam, awayTeam, playerMap, playerImageMap }: {
  shots: ShotmapEntry[]; homeTeam: string; awayTeam: string
  playerMap?: Map<number, string>; playerImageMap?: Map<number, string>
}) {
  const [side, setSide]     = useState<'all' | 'home' | 'away'>('all')
  const [selIdx, setSelIdx] = useState<number | null>(null)

  const filtered = useMemo(
    () => side === 'all' ? shots : shots.filter(s => side === 'home' ? s.home : !s.home),
    [shots, side]
  )
  const sel = selIdx !== null ? (filtered[selIdx] ?? null) : null

  // Portrait half-pitch, goal at top — cropped to 35m from goal
  const PW = 320, PH = 160, CROP = 35
  const toSvgX = (posY: number) => (posY / 100) * PW
  const toSvgY = (posX: number) => Math.min(posX / CROP, 1) * PH

  // Pitch markings (68m wide, 52.5m half shown)
  const pBoxLeft  = (68 - 40.32) / 2 / 68 * PW
  const pBoxRight = (68 + 40.32) / 2 / 68 * PW
  const pBoxDepth = 16.5 / CROP * PH
  const sBoxLeft  = (68 - 18.32) / 2 / 68 * PW
  const sBoxRight = (68 + 18.32) / 2 / 68 * PW
  const sBoxDepth = 5.5 / CROP * PH
  const goalLeft  = (68 - 7.32) / 2 / 68 * PW
  const goalRight = (68 + 7.32) / 2 / 68 * PW
  const penY      = 11 / CROP * PH
  const arcR      = 9.15 / CROP * PH

  const shotColor = (s: ShotmapEntry) => {
    if (s.type === 'goal')  return '#e8c23a'
    if (s.type === 'save')  return '#60a5fa'
    if (s.type === 'block') return '#888'
    if (s.type === 'post')  return '#f59e0b'
    return 'none'
  }
  const shotRadius = (s: ShotmapEntry) =>
    Math.max(s.type === 'goal' ? 6 : 5, Math.min(10, 5 + (s.xg ?? 0) * 9))

  const nav = (dir: 1 | -1) => {
    if (selIdx === null) { setSelIdx(dir === 1 ? 0 : filtered.length - 1); return }
    setSelIdx((selIdx + dir + filtered.length) % filtered.length)
  }

  const pName = (s: ShotmapEntry) =>
    playerMap && s.player_id != null ? (playerMap.get(s.player_id) ?? null) : null

  const ACCENT = '#e8c23a'

  // ── Goal frame constants ──────────────────────────────────────────────────
  const GM_W = 300, GM_H = 100
  const GM_NET_H = GM_H - 18   // net area (posts extend below)
  const cellW = GM_W / 3
  const cellH = GM_NET_H / 2

  // Parse gml text → zone grid cell (row 0=high, row 1=low; col 0=left, 1=center, 2=right)
  // Perspective: shooter's view — "left" = left on screen
  const parseZone = (gml: string | null | undefined): { row: number; col: number } | null => {
    if (!gml) return null
    const g = gml.toLowerCase()
    const row = g.includes('high') ? 0 : g.includes('low') ? 1 : -1
    const col = g.includes('left') ? 0 : g.includes('center') || g.includes('centre') ? 1 : g.includes('right') ? 2 : -1
    if (row < 0 || col < 0) return null
    return { row, col }
  }

  // Dot position: center of the gml zone cell (always correct by definition)
  const zoneDot = (gml: string | null | undefined) => {
    const zone = parseZone(gml)
    if (!zone) return null
    return {
      cx: zone.col * cellW + cellW / 2,
      cy: zone.row * cellH + cellH / 2,
    }
  }

  // Render goal frame: 2x3 zone grid + highlighted cell + shot dot
  const GoalFrame = ({ shot }: { shot: ShotmapEntry }) => {
    const zone = parseZone(shot.gml)
    const dot  = zoneDot(shot.gml)
    const c    = shotColor(shot)
    const fc   = c === 'none' ? '#888' : c
    const isOffTarget = !zone && !!shot.gml

    return (
      <div>
        <div style={{ fontSize: 7, color: '#777', letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}>
          GOAL VIEW
          {shot.gml && (
            <span style={{ marginLeft: 8, color: fc, fontWeight: 700, letterSpacing: 1.5 }}>
              {shot.gml.toUpperCase()}
            </span>
          )}
        </div>
        <svg viewBox={`0 0 ${GM_W} ${GM_H + 4}`} style={{ width: '100%', display: 'block' }}>
          {/* Net background */}
          <rect x={0} y={0} width={GM_W} height={GM_NET_H} fill="#0c0c0c" />

          {/* Zone cells — highlighted cell shows where ball went */}
          {Array.from({ length: 2 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const isActive = zone?.row === row && zone?.col === col
              return (
                <rect key={`${row}-${col}`}
                  x={col * cellW} y={row * cellH}
                  width={cellW} height={cellH}
                  fill={isActive ? `${fc}28` : 'none'}
                  stroke="#1e1e1e" strokeWidth={0.8}
                />
              )
            })
          )}

          {/* Net texture grid (finer than zone grid) */}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`nv${i}`} x1={(i + 1) * GM_W / 9} y1={0}
              x2={(i + 1) * GM_W / 9} y2={GM_NET_H} stroke="#111" strokeWidth={0.4} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <line key={`nh${i}`} x1={0} y1={(i + 1) * GM_NET_H / 5}
              x2={GM_W} y2={(i + 1) * GM_NET_H / 5} stroke="#111" strokeWidth={0.4} />
          ))}

          {/* Zone dividers (bolder) */}
          <line x1={cellW}     y1={0} x2={cellW}     y2={GM_NET_H} stroke="#242424" strokeWidth={1.2} />
          <line x1={cellW * 2} y1={0} x2={cellW * 2} y2={GM_NET_H} stroke="#242424" strokeWidth={1.2} />
          <line x1={0} y1={cellH} x2={GM_W} y2={cellH} stroke="#242424" strokeWidth={1.2} />

          {/* Goal frame border */}
          <rect x={0} y={0} width={GM_W} height={GM_NET_H}
            fill="none" stroke="#2e2e2e" strokeWidth={2} />

          {/* Posts */}
          <line x1={0}    y1={GM_NET_H} x2={0}    y2={GM_H + 4} stroke="#2a2a2a" strokeWidth={2.5} />
          <line x1={GM_W} y1={GM_NET_H} x2={GM_W} y2={GM_H + 4} stroke="#2a2a2a" strokeWidth={2.5} />

          {/* Off-target label (High / Wide — no zone cell to highlight) */}
          {isOffTarget && (
            <text x={GM_W / 2} y={GM_NET_H / 2 + 4} textAnchor="middle"
              fill={fc} fontSize={10} fontWeight={700} letterSpacing={3} opacity={0.5}>
              {shot.gml!.toUpperCase()}
            </text>
          )}

          {/* Shot dot — placed at zone center, always in the correct zone */}
          {dot && (
            <>
              {/* Active zone border highlight */}
              {zone && (
                <rect
                  x={zone.col * cellW + 1} y={zone.row * cellH + 1}
                  width={cellW - 2} height={cellH - 2}
                  fill="none" stroke={fc} strokeWidth={1} opacity={0.35}
                  rx={1}
                />
              )}
              <circle cx={dot.cx} cy={dot.cy} r={9} fill={fc} opacity={0.15} />
              <circle cx={dot.cx} cy={dot.cy} r={6} fill={fc} opacity={0.9} />
              {shot.type === 'goal' && (
                <circle cx={dot.cx} cy={dot.cy} r={3} fill="#000" opacity={0.4} />
              )}
            </>
          )}

          {/* Perspective label */}
          <text x={GM_W / 2} y={GM_H + 3} textAnchor="middle"
            fill="#444" fontSize={6} letterSpacing={2}>SHOOTER VIEW</text>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Team filter pills */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
        {(['all', 'home', 'away'] as const).map(s => (
          <button key={s} onClick={() => { setSide(s); setSelIdx(null) }} style={{
            padding: '3px 14px', fontSize: 8, letterSpacing: 2, fontWeight: 700,
            border: `1px solid ${side === s ? ACCENT : '#2a2a2a'}`,
            background: side === s ? ACCENT : 'transparent',
            color: side === s ? '#000' : '#666',
            borderRadius: 20, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.12s',
          }}>
            {s === 'all' ? 'ALL' : s === 'home' ? homeTeam.toUpperCase() : awayTeam.toUpperCase()}
          </button>
        ))}
        <span style={{ fontSize: 8, color: '#555', letterSpacing: 1.5, marginLeft: 6 }}>
          {filtered.length} SHOTS
        </span>
      </div>

      {/* Half-pitch SVG */}
      <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width: '100%', maxWidth: 360, display: 'block' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={0} y={i * PH / 7} width={PW} height={PH / 14}
            fill={i % 2 === 0 ? '#0d1a0d' : '#0a160a'} />
        ))}
        <rect x={0.5} y={0.5} width={PW - 1} height={PH - 1}
          fill="none" stroke="#1a2a1a" strokeWidth={0.8} />
        <rect x={pBoxLeft} y={0} width={pBoxRight - pBoxLeft} height={pBoxDepth}
          fill="none" stroke="#1e2e1e" strokeWidth={0.8} />
        <rect x={sBoxLeft} y={0} width={sBoxRight - sBoxLeft} height={sBoxDepth}
          fill="none" stroke="#182018" strokeWidth={0.6} />
        <rect x={goalLeft} y={-4} width={goalRight - goalLeft} height={6}
          fill="none" stroke="#2a2a2a" strokeWidth={1.2} />
        <circle cx={PW / 2} cy={penY} r={2} fill="#182018" />
        <path d={`M ${PW / 2 - arcR} ${pBoxDepth} A ${arcR} ${arcR} 0 0 0 ${PW / 2 + arcR} ${pBoxDepth}`}
          fill="none" stroke="#182018" strokeWidth={0.6} />
        <line x1={0} y1={PH - 0.5} x2={PW} y2={PH - 0.5} stroke="#181818" strokeWidth={0.6} strokeDasharray="4,4" />
        <text x={PW - 4} y={PH - 4} textAnchor="end" fontSize={5} fill="#2a2a2a" letterSpacing={1}>35M</text>

        {filtered.map((s, i) => {
          if (!s.pos) return null
          const cx     = toSvgX(s.pos.y)
          const cy     = toSvgY(s.pos.x)
          const r      = shotRadius(s)
          const isSel  = selIdx === i
          const isMiss = s.type === 'miss'
          const c      = shotColor(s)
          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => setSelIdx(isSel ? null : i)}>
              {isMiss
                ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#666" strokeWidth={1.4}
                    opacity={isSel ? 1 : 0.65} />
                : <circle cx={cx} cy={cy} r={r} fill={c} opacity={isSel ? 1 : 0.82} />
              }
              {s.type === 'goal' && (
                <circle cx={cx} cy={cy} r={r - 2.5} fill="none" stroke="#000" strokeWidth={0.8} opacity={0.4} />
              )}
              {isSel && (
                <circle cx={cx} cy={cy} r={r + 4} fill="none"
                  stroke={isMiss ? '#777' : c} strokeWidth={1.6} opacity={0.8} />
              )}
            </g>
          )
        })}

        {/* Trajectory arrow for selected shot */}
        {sel !== null && sel.pos && (() => {
          const sx   = toSvgX(sel.pos.y)
          const sy   = toSvgY(sel.pos.x)
          const zone = parseZone(sel.gml)
          const gMid = (goalLeft + goalRight) / 2
          const tgtX = zone
            ? goalLeft + (goalRight - goalLeft) * (zone.col * 2 + 1) / 6
            : gMid
          const tgtY = 3
          const fc   = shotColor(sel) === 'none' ? '#888' : shotColor(sel)
          const ang  = Math.atan2(tgtY - sy, tgtX - sx)
          const aLen = 9, aW = 0.38
          const p1x  = tgtX - aLen * Math.cos(ang - aW)
          const p1y  = tgtY - aLen * Math.sin(ang - aW)
          const p2x  = tgtX - aLen * Math.cos(ang + aW)
          const p2y  = tgtY - aLen * Math.sin(ang + aW)
          return (
            <g opacity={0.7}>
              <line x1={sx} y1={sy} x2={tgtX} y2={tgtY}
                stroke={fc} strokeWidth={1.4} strokeDasharray="4,2.5" />
              <polygon points={`${tgtX},${tgtY} ${p1x},${p1y} ${p2x},${p2y}`} fill={fc} />
            </g>
          )
        })()}
      </svg>

      {/* Legend */}
      {sel === null && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
          {[
            { c: '#e8c23a', l: 'GOAL',       filled: true  },
            { c: '#60a5fa', l: 'ON TARGET',  filled: true  },
            { c: '#888',    l: 'BLOCKED',    filled: true  },
            { c: '#f59e0b', l: 'WOODWORK',   filled: true  },
            { c: '#666',    l: 'OFF TARGET', filled: false },
          ].map(({ c, l, filled }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {filled
                ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                : <div style={{ width: 7, height: 7, borderRadius: '50%', border: `1.5px solid ${c}`, flexShrink: 0 }} />
              }
              <span style={{ fontSize: 7, color: '#555', letterSpacing: 1 }}>{l}</span>
            </div>
          ))}
          <span style={{ fontSize: 7, color: '#444', letterSpacing: 1, alignSelf: 'center', marginLeft: 4 }}>
            · TAP SHOT FOR DETAIL
          </span>
        </div>
      )}

      {/* Detail panel */}
      {sel !== null && selIdx !== null && (
        <div style={{ width: '100%', maxWidth: 360, marginTop: 14, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 4 }}>
          {/* Nav header — player photo + name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
            <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&#8249;</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {sel.player_id != null && playerImageMap?.get(sel.player_id) ? (
                <img src={playerImageMap.get(sel.player_id)!} width={40} height={40} alt=""
                  style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid #2a2a2a', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16 }}>{sel.type === 'goal' ? '⚽' : '🎯'}</span>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e0e0e0', letterSpacing: 0.5 }}>
                  {pName(sel) ?? (sel.home ? homeTeam : awayTeam)}
                </div>
                <div style={{ fontSize: 8, color: '#777', letterSpacing: 2, marginTop: 2 }}>
                  {sel.min != null ? `${sel.min}'` : '—'}&nbsp;&middot;&nbsp;
                  {sel.home ? homeTeam.toUpperCase() : awayTeam.toUpperCase()}&nbsp;&middot;&nbsp;
                  {selIdx + 1} / {filtered.length}
                </div>
              </div>
            </div>
            <button onClick={() => nav(1)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&#8250;</button>
          </div>

          {/* Goal frame */}
          <div style={{ padding: '12px 14px 8px' }}>
            <GoalFrame shot={sel} />
          </div>

          {/* Stats */}
          <div style={{ padding: '8px 14px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 4px', borderTop: '1px solid #141414' }}>
            {[
              { label: 'xG',        value: sel.xg   != null ? sel.xg.toFixed(2)   : '—' },
              { label: 'xGOT',      value: sel.xgot != null ? sel.xgot.toFixed(2) : '—' },
              { label: 'OUTCOME',   value: (sel.type ?? '—').toUpperCase() },
              { label: 'SITUATION', value: sel.sit  ? sel.sit.replace(/_/g, ' ').toUpperCase() : '—' },
            ].map(({ label, value }) => {
              const c = shotColor(sel)
              return (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 7, color: '#666', letterSpacing: 1.5 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c === 'none' ? '#888' : c, marginTop: 3 }}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 4px' }}>
            {[
              { label: 'SHOT TYPE', value: sel.body ? sel.body.replace(/_/g, ' ').toUpperCase() : '—' },
              { label: 'GOAL ZONE', value: sel.gml  ? sel.gml.toUpperCase() : '—' },
            ].map(({ label, value }) => {
              const c = shotColor(sel)
              return (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 7, color: '#666', letterSpacing: 1.5 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c === 'none' ? '#888' : c, marginTop: 3 }}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* xG Timeline */
export function XgTimeline({ entries, homeTeam, awayTeam, xgHome, xgAway }: {
  entries: XgMinuteEntry[]; homeTeam: string; awayTeam: string
  xgHome: number | null; xgAway: number | null
}) {
  if (entries.length === 0) return null
  const W = 300, H = 60, PAD_L = 22, PAD_R = 8, PAD_T = 6, PAD_B = 14
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const maxMin = Math.max(...entries.map(e => e.m), 90)
  const maxXg  = Math.max(...entries.map(e => Math.max(e.cum_home, e.cum_away)), 0.5)
  const toX = (m: number) => PAD_L + (m / maxMin) * innerW
  const toY = (v: number) => PAD_T + innerH - (v / maxXg) * innerH

  const buildPath = (key: 'cum_home' | 'cum_away') => {
    const pts: [number, number][] = [[0, 0], ...entries.map(e => [e.m, e[key]] as [number, number])]
    return pts.map(([m, v], i) => `${i === 0 ? 'M' : 'L'} ${toX(m).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ')
  }

  const minuteMarks = [15, 30, 45, 60, 75, 90]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      {/* Background */}
      <rect width={W} height={H} fill="#111" />
      {/* Grid lines */}
      {minuteMarks.map(m => (
        <line key={m} x1={toX(m)} y1={PAD_T} x2={toX(m)} y2={PAD_T + innerH} stroke="#191919" strokeWidth={0.5} />
      ))}
      {/* HT marker */}
      <line x1={toX(45)} y1={PAD_T} x2={toX(45)} y2={PAD_T + innerH} stroke="#222" strokeWidth={0.8} strokeDasharray="2,2" />
      {/* xG area fills */}
      <path d={`${buildPath('cum_home')} L ${toX(maxMin)} ${PAD_T + innerH} L ${PAD_L} ${PAD_T + innerH} Z`}
        fill="var(--color-accent)" opacity={0.06} />
      <path d={`${buildPath('cum_away')} L ${toX(maxMin)} ${PAD_T + innerH} L ${PAD_L} ${PAD_T + innerH} Z`}
        fill="#1a4a7a" opacity={0.06} />
      {/* xG lines */}
      <path d={buildPath('cum_home')} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinejoin="round" />
      <path d={buildPath('cum_away')} fill="none" stroke="#c8c8c8" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Minute labels */}
      {minuteMarks.map(m => (
        <text key={m} x={toX(m)} y={H - 3} textAnchor="middle" fontSize={5} fill="#555">{m}&apos;</text>
      ))}
      {/* Y-axis labels */}
      {[0, maxXg / 2, maxXg].map((v, i) => (
        <text key={i} x={PAD_L - 3} y={toY(v) + 2} textAnchor="end" fontSize={5} fill="#666">
          {v.toFixed(1)}
        </text>
      ))}
      {/* End labels */}
      {xgHome !== null && (
        <text x={W - PAD_R + 1} y={toY(entries[entries.length - 1]?.cum_home ?? 0) + 2}
          fontSize={6} fill="var(--color-accent)" textAnchor="start">{xgHome.toFixed(2)}</text>
      )}
      {xgAway !== null && (
        <text x={W - PAD_R + 1} y={toY(entries[entries.length - 1]?.cum_away ?? 0) + 2}
          fontSize={6} fill="#c8c8c8" textAnchor="start">{xgAway.toFixed(2)}</text>
      )}
    </svg>
  )
}

/* Momentum Wave */
export function MomentumWave({ momentum, homeAbbr, awayAbbr, goals }: {
  momentum: unknown[]; homeAbbr: string; awayAbbr: string
  goals?: Array<{ minute: number; isHome: boolean; isPenalty: boolean }>
}) {
  if (!momentum || momentum.length === 0) return null

  type MomEntry = { minute: number; value: number }
  const raw: MomEntry[] = momentum.map((e) => {
    const r = e as Record<string, unknown>
    return {
      minute: Number(r.minute ?? r.m ?? r.min ?? 0),
      value:  Number(r.value  ?? r.v  ?? r.val ?? r.home ?? 50),
    }
  }).filter(e => e.minute > 0)
  if (raw.length === 0) return null

  // Values 0-100 (50=neutral) shift to -50..+50
  const maxRaw = Math.max(...raw.map(e => Math.abs(e.value)))
  const center = maxRaw > 1 ? 50 : 0
  const entries = raw.map(e => ({ minute: e.minute, value: e.value - center }))

  const W = 300, H = 60, PAD_L = 24, PAD_R = 8, PAD_T = 4, PAD_B = 14
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const midY = PAD_T + innerH / 2
  const maxMin = Math.max(...entries.map(e => e.minute), 90)
  const maxAbs = Math.max(...entries.map(e => Math.abs(e.value)), 1)
  const toX = (m: number) => PAD_L + (m / maxMin) * innerW
  const barW = Math.max(1, (innerW / entries.length) * 0.82)
  const minuteMarks = [15, 30, 45, 60, 75, 90]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <rect width={W} height={H} fill="#111" />
      {minuteMarks.map(m => (
        <line key={m} x1={toX(m)} y1={PAD_T} x2={toX(m)} y2={PAD_T + innerH}
          stroke="#191919" strokeWidth={0.5} />
      ))}
      <line x1={toX(45)} y1={PAD_T} x2={toX(45)} y2={PAD_T + innerH}
        stroke="#222" strokeWidth={0.8} strokeDasharray="2,2" />
      <line x1={PAD_L} y1={midY} x2={W - PAD_R} y2={midY} stroke="#252525" strokeWidth={0.6} />
      <text x={PAD_L - 3} y={midY - 5} textAnchor="end" fontSize={5} fill="var(--color-accent)">{homeAbbr}</text>
      <text x={PAD_L - 3} y={midY + 10} textAnchor="end" fontSize={5} fill="#d4d4d4">{awayAbbr}</text>
      {entries.map((e, i) => {
        const cx = toX(e.minute)
        const norm = e.value / maxAbs
        const bh = Math.max(0.5, Math.abs(norm) * (innerH / 2) * 0.88)
        const isHome = e.value < 0
        return (
          <rect key={i}
            x={cx - barW / 2} y={isHome ? midY - bh : midY}
            width={barW} height={bh}
            fill={isHome ? 'var(--color-accent)' : '#d4d4d4'}
            opacity={0.9}
          />
        )
      })}
      {minuteMarks.map(m => (
        <text key={m} x={toX(m)} y={H - 3} textAnchor="middle" fontSize={5} fill="#555">{m}&apos;</text>
      ))}
      {goals && goals.map((g, i) => {
        const gx = toX(Math.min(g.minute, maxMin))
        const clr = g.isHome ? 'var(--color-accent)' : '#d4d4d4'
        const lineY1 = g.isHome ? PAD_T : midY
        const lineY2 = g.isHome ? midY   : PAD_T + innerH
        const dotY   = g.isHome ? PAD_T + 3 : PAD_T + innerH - 3
        return (
          <g key={i}>
            <line x1={gx} y1={lineY1} x2={gx} y2={lineY2} stroke={clr} strokeWidth={0.8} strokeDasharray="2,1.5" opacity={0.55} />
            <GoalBallG cx={gx} cy={dotY} r={2.8} color={clr} isPenalty={g.isPenalty} />
          </g>
        )
      })}
    </svg>
  )
}

/* Average Positions Pitch */
export function AvgPositionsViz({ positions, homeTeam, awayTeam }: {
  positions: { home: AvgPosition[]; away: AvgPosition[] }
  homeTeam: string; awayTeam: string
}) {
  const home = positions?.home ?? []
  const away = positions?.away ?? []
  if (home.length === 0 && away.length === 0) return null

  const PW = 210, PH = 136
  const R = 7  // circle radius (bigger to fit jersey number)
  // x=0..100 own-goal→opp-goal; y=0..100 left→right touchline
  const toHome = (x: number, y: number) => ({ cx: (x / 100) * PW, cy: (y / 100) * PH })
  const toAway = (x: number, y: number) => ({ cx: PW - (x / 100) * PW, cy: PH - (y / 100) * PH })

  const posCol = (pos: string) => {
    const p = (pos ?? '').toUpperCase()
    if (p.startsWith('G')) return '#cc7a00'
    if (p.startsWith('D')) return '#1a6b2e'
    if (p.startsWith('M')) return '#1a3f6b'
    return '#6b1a1a'
  }
  // Last name, max 8 chars
  const short = (name: string) => {
    const parts = name.trim().split(/\s+/)
    return (parts.length === 1 ? name : parts[parts.length - 1]).slice(0, 8)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 2px' }}>
        <span style={{ fontSize: 9, color: '#f5f0e8', letterSpacing: 1, fontWeight: 700 }}>{homeTeam.toUpperCase()} {'→'}</span>
        <span style={{ fontSize: 9, color: '#f5f0e8', letterSpacing: 1 }}>{'←'} {awayTeam.toUpperCase()}</span>
      </div>
      {/* viewBox extended at top/bottom to prevent name clipping near edges */}
      <svg viewBox={`0 -8 ${PW} ${PH + 16}`} style={{ width: '100%', display: 'block' }}>
        <rect y={-8} width={PW} height={PH + 16} fill="#0a1a0a" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={(i / 10) * PW} y={0} width={PW / 10} height={PH}
            fill={i % 2 === 0 ? '#0a1a0a' : '#0c1f0c'} />
        ))}
        <rect x={1} y={1} width={PW - 2} height={PH - 2} fill="none" stroke="#1e3a1e" strokeWidth={0.8} />
        <line x1={PW / 2} y1={1} x2={PW / 2} y2={PH - 1} stroke="#1e3a1e" strokeWidth={0.7} />
        <circle cx={PW / 2} cy={PH / 2} r={(18.3 / 105) * PW} fill="none" stroke="#1e3a1e" strokeWidth={0.6} />
        <circle cx={PW / 2} cy={PH / 2} r={1} fill="#1e3a1e" />
        <rect x={1} y={PH * 0.18} width={PW * 0.17} height={PH * 0.64} fill="none" stroke="#1e3a1e" strokeWidth={0.6} />
        <rect x={PW * 0.83} y={PH * 0.18} width={PW * 0.17 - 1} height={PH * 0.64} fill="none" stroke="#1e3a1e" strokeWidth={0.6} />
        <rect x={1} y={PH * 0.36} width={PW * 0.055} height={PH * 0.28} fill="none" stroke="#1a321a" strokeWidth={0.4} />
        <rect x={PW * 0.945} y={PH * 0.36} width={PW * 0.055 - 1} height={PH * 0.28} fill="none" stroke="#1a321a" strokeWidth={0.4} />
        <rect x={0} y={PH * 0.42} width={2.5} height={PH * 0.16} fill="none" stroke="#2a5a2a" strokeWidth={0.8} />
        <rect x={PW - 2.5} y={PH * 0.42} width={2.5} height={PH * 0.16} fill="none" stroke="#2a5a2a" strokeWidth={0.8} />
        {home.map((p, i) => {
          const { cx, cy } = toHome(p.x, p.y)
          return (
            <g key={`h${i}`}>
              <circle cx={cx} cy={cy} r={R} fill={posCol(p.pos)} opacity={0.92} />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--color-accent)" strokeWidth={0.8} opacity={0.5} />
              {/* Jersey number inside circle */}
              <text x={cx} y={cy + 1.6} textAnchor="middle" dominantBaseline="middle"
                fontSize={4.5} fill="#fff" fontWeight="bold">{p.n}</text>
              {/* Player last name below circle */}
              <text x={cx} y={cy + R + 4.5} textAnchor="middle"
                fontSize={4} fill="#f5f0e8" opacity={0.85}>{short(p.name)}</text>
            </g>
          )
        })}
        {away.map((p, i) => {
          const { cx, cy } = toAway(p.x, p.y)
          return (
            <g key={`a${i}`}>
              <circle cx={cx} cy={cy} r={R} fill={posCol(p.pos)} opacity={0.7} />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="#888" strokeWidth={0.8} opacity={0.5} />
              {/* Jersey number inside circle */}
              <text x={cx} y={cy + 1.6} textAnchor="middle" dominantBaseline="middle"
                fontSize={4.5} fill="#fff" fontWeight="bold">{p.n}</text>
              {/* Player last name below circle */}
              <text x={cx} y={cy + R + 4.5} textAnchor="middle"
                fontSize={4} fill="#c8c8c8" opacity={0.85}>{short(p.name)}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {[['#cc7a00','GK'],['#1a6b2e','DEF'],['#1a3f6b','MID'],['#6b1a1a','FWD']].map(([col, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
            <span style={{ fontSize: 8, color: '#888', letterSpacing: 1 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
