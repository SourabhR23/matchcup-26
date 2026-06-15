'use client'

import { useState, useEffect } from 'react'
import FlagImg from './FlagImg'

interface StickyScoreBarProps {
  homeTeam: string
  awayTeam: string
  homeAbbr: string
  awayAbbr: string
  homeScore: number | null
  awayScore: number | null
  isLive?: boolean
  currentMinute?: number | null
  scrollThreshold?: number
}

export default function StickyScoreBar({
  homeTeam, awayTeam, homeAbbr, awayAbbr,
  homeScore, awayScore, isLive, currentMinute,
  scrollThreshold = 200,
}: StickyScoreBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > scrollThreshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollThreshold])

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--topbar-height, 44px)',
        left: 0, right: 0,
        zIndex: 50,
        background: '#0a0a0a',
        borderBottom: '1px solid #222',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Home team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #2a2a2a', background: '#111', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FlagImg country={homeTeam} width={32} />
        </div>
        <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 18, color: '#f5f0e8', letterSpacing: 2 }}>
          {homeAbbr}
        </span>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 26, color: 'var(--color-accent)', letterSpacing: 3, lineHeight: 1 }}>
          {homeScore ?? 0}–{awayScore ?? 0}
        </div>
        <div style={{ fontSize: 9, letterSpacing: 1, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {isLive && currentMinute ? (
            <>
              <span className="live-dot" style={{ background: 'var(--color-danger)', color: 'var(--color-danger)' }} />
              <span style={{ color: 'var(--color-danger)' }}>{currentMinute}&apos;</span>
            </>
          ) : (
            <span style={{ color: '#555' }}>FULL TIME</span>
          )}
        </div>
      </div>

      {/* Away team */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 18, color: '#f5f0e8', letterSpacing: 2 }}>
          {awayAbbr}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #2a2a2a', background: '#111', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FlagImg country={awayTeam} width={32} />
        </div>
      </div>
    </div>
  )
}
