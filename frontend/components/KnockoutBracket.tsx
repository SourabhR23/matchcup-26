'use client'

import { useState } from 'react'
import Link from 'next/link'
import FlagImg from './FlagImg'
import type { MatchEvent } from '@/lib/types'

/* ─── Layout constants ─── */
const CW   = 196
const CH   = 80
const SLOT = 108
const HGAP = 56
const COL  = CW + HGAP
const HDR  = 44

/* ─── Round metadata ─── */
const MAIN_ROUNDS = ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']
const ALL_ROUNDS  = [...MAIN_ROUNDS, '3rd Place']

const SHORT: Record<string, string> = {
  'Round of 32':   'R32',
  'Round of 16':   'R16',
  'Quarter-Final': 'QF',
  'Semi-Final':    'SF',
  'Final':         'FINAL',
  '3rd Place':     '3RD',
}

function normalizeRound(name: string): string {
  const n = name.toLowerCase().trim()
  if (n.includes('32'))                                                               return 'Round of 32'
  if (n.includes('16'))                                                               return 'Round of 16'
  if (n.includes('quarter'))                                                          return 'Quarter-Final'
  if (n.includes('semi'))                                                             return 'Semi-Final'
  if (n.includes('3rd') || n.includes('third') || n.includes('bronze') || n.includes('place')) return '3rd Place'
  if (n.includes('final'))                                                            return 'Final'
  return name
}

function yc(rIdx: number, mIdx: number): number {
  if (rIdx === 0) return (mIdx + 0.5) * SLOT
  const span = Math.pow(2, rIdx)
  return (mIdx * span + span / 2) * SLOT
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

/* ─── Compact bracket card (used in SVG bracket) ─── */
function Card({ m, w }: { m: MatchEvent; w?: number }) {
  const done = m.status === 'finished'
  const live = m.status === 'live' || m.status === 'inprogress'
  const hWon = done && m.home_score !== null && m.away_score !== null && m.home_score > m.away_score
  const aWon = done && m.home_score !== null && m.away_score !== null && m.away_score > m.home_score
  const sides = [
    { name: m.home_team, score: m.home_score, won: hWon },
    { name: m.away_team, score: m.away_score, won: aWon },
  ]

  return (
    <Link
      href={done || live ? `/matches/${m.id}` : '#'}
      style={{
        display: 'block', width: w,
        background: 'var(--color-surface)',
        border: live ? '1px solid var(--color-accent)' : '0.5px solid #d8d4cc',
        textDecoration: 'none', color: 'var(--color-ink)', position: 'relative',
      }}
    >
      {live && (
        <span style={{
          position: 'absolute', top: 2, right: 5, fontSize: 8,
          color: 'var(--color-accent)', fontFamily: 'var(--font-bebas,sans-serif)', letterSpacing: 1,
        }}>LIVE</span>
      )}
      {sides.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px',
          borderBottom: i === 0 ? '0.5px solid #ede9e0' : undefined,
          background: s.won ? '#f5f3ee' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1 }}>
            <FlagImg country={s.name} width={15} />
            <span style={{
              fontSize: 11, fontWeight: s.won ? 700 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              opacity: done && !s.won ? 0.4 : 1,
            }}>{s.name || '—'}</span>
          </div>
          {s.score !== null && (
            <span style={{
              fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'right', marginLeft: 8,
              opacity: done && !s.won ? 0.4 : 1,
            }}>{s.score}</span>
          )}
        </div>
      ))}
      <div style={{ padding: '2px 8px 5px', fontSize: 9, color: '#aaa', letterSpacing: 0.5 }}>
        {fmt(m.event_date)}
      </div>
    </Link>
  )
}

/* ─── Detailed match card (used in round focus view) ─── */
function DetailCard({ m }: { m: MatchEvent }) {
  const done = m.status === 'finished'
  const live = m.status === 'live' || m.status === 'inprogress'
  const hWon = done && m.home_score !== null && m.away_score !== null && m.home_score > m.away_score
  const aWon = done && m.home_score !== null && m.away_score !== null && m.away_score > m.home_score

  const statusBadge = live
    ? { label: 'LIVE', bg: 'var(--color-accent)', color: '#fff' }
    : done
    ? { label: 'FT',   bg: '#111',                 color: 'var(--color-accent)' }
    : { label: fmt(m.event_date), bg: '#f0ece4', color: '#666' }

  return (
    <Link
      href={done || live ? `/matches/${m.id}` : '#'}
      style={{
        display: 'block', textDecoration: 'none', color: 'var(--color-ink)',
        background: 'var(--color-surface)',
        border: live ? '1px solid var(--color-accent)' : '0.5px solid #d8d4cc',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px',
        borderBottom: '0.5px solid #ede9e0',
        background: '#faf8f4',
      }}>
        <span style={{
          fontSize: 9, color: '#aaa', letterSpacing: 0.5,
        }}>{fmtFull(m.event_date)}</span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-bebas,sans-serif)', letterSpacing: 1,
          padding: '1px 6px',
          background: statusBadge.bg, color: statusBadge.color,
        }}>{statusBadge.label}</span>
      </div>

      {/* Teams */}
      {[
        { name: m.home_team, score: m.home_score, won: hWon, lost: done && !hWon },
        { name: m.away_team, score: m.away_score, won: aWon, lost: done && !aWon },
      ].map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px',
          borderBottom: i === 0 ? '0.5px solid #ede9e0' : undefined,
          background: s.won ? '#f5f3ee' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
            <FlagImg country={s.name} width={22} />
            <span style={{
              fontSize: 14, fontWeight: s.won ? 700 : 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              opacity: s.lost ? 0.4 : 1,
            }}>{s.name || '—'}</span>
          </div>
          {s.score !== null && (
            <span style={{
              fontSize: 22, fontFamily: 'var(--font-bebas,sans-serif)',
              fontWeight: 700, minWidth: 24, textAlign: 'right', marginLeft: 12,
              opacity: s.lost ? 0.4 : 1,
              color: s.won ? 'var(--color-ink)' : undefined,
            }}>{s.score}</span>
          )}
        </div>
      ))}

      {/* Venue */}
      {m.venue && (
        <div style={{
          padding: '5px 12px', fontSize: 9, color: '#aaa',
          letterSpacing: 0.5, borderTop: '0.5px solid #f0ece4',
        }}>
          {m.venue.name}{m.venue.city ? ` · ${m.venue.city}` : ''}
        </div>
      )}
    </Link>
  )
}

/* ─── Round detail view (replaces bracket on click) ─── */
function RoundDetail({
  roundName,
  matches,
  onBack,
}: {
  roundName: string
  matches: MatchEvent[]
  onBack: () => void
}) {
  const played   = matches.filter(m => m.status === 'finished').length
  const upcoming = matches.filter(m => m.status !== 'finished' && m.status !== 'live' && m.status !== 'inprogress').length
  const live     = matches.filter(m => m.status === 'live' || m.status === 'inprogress').length

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 20, paddingBottom: 16,
        borderBottom: '0.5px solid #d8d4cc',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '0.5px solid #d8d4cc',
            padding: '7px 14px', cursor: 'pointer',
            fontFamily: 'var(--font-bebas,sans-serif)', fontSize: 14,
            letterSpacing: 1, color: '#666',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          ← BRACKET
        </button>

        <div>
          <div style={{
            fontFamily: 'var(--font-bebas,sans-serif)',
            fontSize: 26, letterSpacing: 3, lineHeight: 1,
          }}>{roundName.toUpperCase()}</div>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: 0.5, marginTop: 2 }}>
            {matches.length} MATCHES
            {played > 0 && <span style={{ marginLeft: 8, color: '#555' }}>{played} PLAYED</span>}
            {live > 0 && <span style={{ marginLeft: 8, color: 'var(--color-accent)' }}>{live} LIVE</span>}
            {upcoming > 0 && <span style={{ marginLeft: 8 }}>{upcoming} UPCOMING</span>}
          </div>
        </div>
      </div>

      {/* Match grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {matches.map(m => <DetailCard key={m.id} m={m} />)}
      </div>
    </div>
  )
}

/* ─── Desktop: SVG bracket + focus mode ─── */
function Desktop({ byRound }: { byRound: Record<string, MatchEvent[]> }) {
  const [focusedRound, setFocusedRound] = useState<string | null>(null)

  const r32Count = Math.max(byRound['Round of 32']?.length ?? 0, 16)
  const bH       = r32Count * SLOT
  const bW       = MAIN_ROUNDS.length * COL - HGAP
  const third    = byRound['3rd Place'] ?? []
  const totalH   = HDR + bH + (third.length ? CH + 48 : 0)

  /* ── Focused round view ── */
  if (focusedRound) {
    const matches = byRound[focusedRound] ?? []
    return (
      <RoundDetail
        roundName={focusedRound}
        matches={matches}
        onBack={() => setFocusedRound(null)}
      />
    )
  }

  /* ── Full bracket view ── */
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ position: 'relative', width: bW, height: totalH, minWidth: bW }}>

        {/* Clickable round header bars */}
        {MAIN_ROUNDS.map((rName, rIdx) => {
          const hasMatches = (byRound[rName]?.length ?? 0) > 0
          return (
            <button
              key={rName}
              onClick={() => hasMatches && setFocusedRound(rName)}
              title={hasMatches ? `View all ${rName} matches` : undefined}
              style={{
                position: 'absolute', top: 0, left: rIdx * COL, width: CW,
                background: '#111', textAlign: 'center', padding: '0',
                border: 'none', cursor: hasMatches ? 'pointer' : 'default',
                height: HDR,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 1,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-bebas,sans-serif)',
                color: 'var(--color-accent)', fontSize: 18, letterSpacing: 3,
                lineHeight: 1,
              }}>{SHORT[rName]}</span>
              {hasMatches && (
                <span style={{
                  fontSize: 7, color: '#555', letterSpacing: 1,
                  fontFamily: 'var(--font-bebas,sans-serif)',
                }}>VIEW ▸</span>
              )}
            </button>
          )
        })}

        {/* SVG connector lines */}
        <svg
          style={{ position: 'absolute', top: HDR, left: 0, pointerEvents: 'none' }}
          width={bW} height={bH}
        >
          {MAIN_ROUNDS.slice(0, -1).map((rName, rIdx) => {
            const nextRound = MAIN_ROUNDS[rIdx + 1]
            const thisM = byRound[rName]  ?? []
            const nextM = byRound[nextRound] ?? []
            const colX  = rIdx * COL
            const midX  = colX + CW + HGAP / 2
            const nextX = (rIdx + 1) * COL
            const stroke = '#d8d4cc'

            return nextM.map((_, pIdx) => {
              const c1Idx = pIdx * 2, c2Idx = pIdx * 2 + 1
              const c1Y = yc(rIdx, c1Idx), c2Y = yc(rIdx, c2Idx), pY = yc(rIdx + 1, pIdx)
              const hasC1 = !!thisM[c1Idx], hasC2 = !!thisM[c2Idx]
              return (
                <g key={`${rIdx}-${pIdx}`}>
                  {hasC1 && <line x1={colX + CW} y1={c1Y} x2={midX} y2={c1Y} stroke={stroke} strokeWidth={0.8} />}
                  {hasC2 && <line x1={colX + CW} y1={c2Y} x2={midX} y2={c2Y} stroke={stroke} strokeWidth={0.8} />}
                  {hasC1 && hasC2 && <line x1={midX} y1={c1Y} x2={midX} y2={c2Y} stroke={stroke} strokeWidth={0.8} />}
                  {nextM[pIdx] && <line x1={midX} y1={pY} x2={nextX} y2={pY} stroke={stroke} strokeWidth={0.8} />}
                </g>
              )
            })
          })}
        </svg>

        {/* Match cards */}
        {MAIN_ROUNDS.map((rName, rIdx) =>
          (byRound[rName] ?? []).map((m, mIdx) => (
            <div key={m.id} style={{
              position: 'absolute',
              left: rIdx * COL,
              top: HDR + yc(rIdx, mIdx) - CH / 2,
              width: CW,
            }}>
              <Card m={m} w={CW} />
            </div>
          ))
        )}

        {/* 3rd place — below bracket, Final column */}
        {third.map(m => (
          <div key={m.id} style={{
            position: 'absolute', left: 4 * COL, top: HDR + bH + 16, width: CW,
          }}>
            <div style={{
              fontSize: 9, color: '#888', letterSpacing: 1, marginBottom: 4,
              fontFamily: 'var(--font-bebas,sans-serif)',
            }}>3RD PLACE</div>
            <Card m={m} w={CW} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Mobile: round-by-round navigator ─── */
function Mobile({ byRound }: { byRound: Record<string, MatchEvent[]> }) {
  const rounds = ALL_ROUNDS.filter(r => (byRound[r]?.length ?? 0) > 0)
  const [idx, setIdx] = useState(0)
  const active  = rounds[idx] ?? rounds[0]
  const matches = byRound[active] ?? []

  if (rounds.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            padding: '6px 14px', background: 'none', border: '0.5px solid #d8d4cc',
            cursor: idx === 0 ? 'default' : 'pointer',
            fontFamily: 'var(--font-bebas,sans-serif)', fontSize: 20,
            color: idx === 0 ? '#ccc' : 'var(--color-ink)', flexShrink: 0,
          }}
        >‹</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-bebas,sans-serif)', fontSize: 22, letterSpacing: 2 }}>
            {SHORT[active] ?? active.toUpperCase()}
          </div>
          <div style={{ fontSize: 9, color: '#999', letterSpacing: 1, marginTop: -2 }}>
            {active.toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => setIdx(i => Math.min(rounds.length - 1, i + 1))}
          disabled={idx === rounds.length - 1}
          style={{
            padding: '6px 14px', background: 'none', border: '0.5px solid #d8d4cc',
            cursor: idx === rounds.length - 1 ? 'default' : 'pointer',
            fontFamily: 'var(--font-bebas,sans-serif)', fontSize: 20,
            color: idx === rounds.length - 1 ? '#ccc' : 'var(--color-ink)', flexShrink: 0,
          }}
        >›</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
        {rounds.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
            border: 'none', padding: 0, cursor: 'pointer',
            background: i === idx ? 'var(--color-accent)' : '#d8d4cc',
            transition: 'width 0.2s',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 11 }}>
            Matches will appear here once confirmed.
          </div>
        ) : (
          matches.map(m => <DetailCard key={m.id} m={m} />)
        )}
      </div>
    </div>
  )
}

/* ─── Main export ─── */
export default function KnockoutBracket({ matches }: { matches: MatchEvent[] }) {
  if (matches.length === 0) {
    return (
      <div style={{
        marginTop: 32, border: '0.5px solid #d8d4cc',
        padding: '48px 24px', textAlign: 'center',
        background: 'var(--color-surface)',
      }}>
        <div style={{
          fontFamily: 'var(--font-bebas,sans-serif)',
          fontSize: 28, letterSpacing: 3, marginBottom: 8,
        }}>KNOCKOUT STAGE</div>
        <p style={{ fontSize: 12, color: '#999', letterSpacing: 0.5 }}>
          Bracket will be set once the group stage concludes.
        </p>
      </div>
    )
  }

  const byRound: Record<string, MatchEvent[]> = {}
  for (const m of matches) {
    const r = normalizeRound(m.round_name || 'Unknown')
    if (!byRound[r]) byRound[r] = []
    byRound[r].push(m)
  }
  for (const r of Object.keys(byRound)) {
    byRound[r].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }

  return (
    <>
      <div className="hidden md:block">
        <Desktop byRound={byRound} />
      </div>
      <div className="md:hidden">
        <Mobile byRound={byRound} />
      </div>
    </>
  )
}
