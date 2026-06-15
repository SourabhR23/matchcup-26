'use client'

import { useState, useEffect } from 'react'

const START = new Date('2026-06-12T00:00:00')
const END   = new Date('2026-07-20T23:59:59')

const DOTS = [
  { key: 'gs',  short: 'Group Stage', startDate: '2026-06-12' },
  { key: 'r32', short: 'R32',         startDate: '2026-06-29' },
  { key: 'r16', short: 'R16',         startDate: '2026-07-04' },
  { key: 'qf',  short: 'QF',          startDate: '2026-07-10' },
  { key: 'sf',  short: 'SF',          startDate: '2026-07-15' },
  { key: 'fin', short: 'Final',       startDate: '2026-07-20' },
]

const DIALOG_STAGES = [
  { label: 'Group Stage',     dateRange: '12/06 – 28/06', start: '2026-06-12' },
  { label: 'Round of 32',     dateRange: '29/06 – 04/07', start: '2026-06-29' },
  { label: 'Round of 16',     dateRange: '04/07 – 08/07', start: '2026-07-04' },
  { label: 'Quarterfinals',   dateRange: '10/07 – 12/07', start: '2026-07-10' },
  { label: 'Semifinals',      dateRange: '15/07 – 16/07', start: '2026-07-15' },
  { label: '3rd Place Match', dateRange: '19/07',          start: '2026-07-19' },
  { label: 'Final',           dateRange: '20/07',          start: '2026-07-20' },
]

function pct(dateStr: string): number {
  const d     = new Date(dateStr)
  const total = END.getTime() - START.getTime()
  return Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / total) * 100))
}

export default function TournamentTimeline() {
  const [open, setOpen]                   = useState(false)
  const [todayPct, setTodayPct]           = useState(0)
  const [inTournament, setInTournament]   = useState(false)
  const [currentDotIdx, setCurrentDotIdx] = useState(-1)
  const [currentDialogIdx, setCurrentDialogIdx] = useState(-1)

  useEffect(() => {
    const today = new Date()
    setTodayPct(pct(today.toISOString()))
    setInTournament(today >= START && today <= END)
    setCurrentDotIdx(DOTS.reduce<number>((acc, d, i) => new Date(d.startDate) <= today ? i : acc, -1))
    setCurrentDialogIdx(DIALOG_STAGES.reduce<number>((acc, s, i) => new Date(s.start) <= today ? i : acc, -1))
  }, [])

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        title="Click to see tournament stages"
        style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Thin bar */}
        <div style={{
          height: 5,
          borderRadius: 99,
          background: '#ccc',
          position: 'relative',
          overflow: 'visible',
        }}>
          {/* Progress fill — dark from start to today */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: inTournament ? todayPct + '%' : '0%',
            background: '#2a2a2a',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />

          {/* Stage dots */}
          {DOTS.map((d, idx) => {
            const p       = pct(d.startDate)
            const isCur   = idx === currentDotIdx
            const isPast  = idx < currentDotIdx
            return (
              <div key={d.key} style={{
                position: 'absolute',
                left: p + '%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}>
                <div style={{
                  width:      isCur ? 13 : 9,
                  height:     isCur ? 13 : 9,
                  borderRadius: '50%',
                  background: (isCur || isPast) ? '#2a2a2a' : '#ccc',
                  border:     isCur ? '2.5px solid #666' : 'none',
                  boxShadow:  isCur ? '0 0 0 3px rgba(0,0,0,0.15)' : 'none',
                }} />
              </div>
            )
          })}
        </div>

        {/* Stage labels below bar */}
        <div style={{ position: 'relative', height: 26, marginTop: 8 }}>
          {DOTS.map((d, idx) => {
            const p     = pct(d.startDate)
            const isCur = idx === currentDotIdx
            return (
              <span key={d.key} style={{
                position: 'absolute',
                left: p + '%',
                transform: 'translateX(-50%)',
                fontSize: 11,
                fontWeight: isCur ? 800 : 500,
                color: isCur ? '#111' : '#999',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                top: 0,
              }}>
                {d.short}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Dialog ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              padding: '24px 28px',
              minWidth: 340,
              maxWidth: 420,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f5f0e8', marginBottom: 20, letterSpacing: 0.5 }}>
              Tournament Stages
            </div>

            {DIALOG_STAGES.map((s, i) => {
              const isCur = i === currentDialogIdx
              return (
                <div key={s.label} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '11px 0',
                  borderBottom: i < DIALOG_STAGES.length - 1 ? '1px solid #242424' : 'none',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    color: isCur ? 'var(--color-accent)' : '#444',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 110,
                    padding: '3px 8px',
                    background: isCur ? 'rgba(185,28,28,0.12)' : 'transparent',
                    borderRadius: 3,
                  }}>{s.dateRange}</span>
                  <span style={{ fontSize: 13, fontWeight: isCur ? 700 : 400, color: isCur ? '#f5f0e8' : '#777' }}>
                    {s.label}
                  </span>
                  {isCur && (
                    <span style={{ marginLeft: 'auto', fontSize: 7, background: 'var(--color-accent)', color: '#fff', padding: '2px 6px', letterSpacing: 1.5, fontWeight: 800, borderRadius: 2 }}>
                      NOW
                    </span>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: 20, width: '100%',
                padding: '11px 0',
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: 'var(--color-accent)',
                fontSize: 10, fontWeight: 800, letterSpacing: 2,
                cursor: 'pointer', borderRadius: 4,
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  )
}
