'use client'

import type { BsdFractionStat } from '@/lib/types'

export interface SBProps { label: string; h: number; a: number; isPercent?: boolean; hideWhenZero?: boolean }

/* ── Stats Variant A – Dark Broadcast ────────────────────────────── */
export function StatSectionA({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginTop: 22, marginBottom: 2,
    }}>
      <div style={{ width: 3, height: 14, background: 'var(--color-accent)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, letterSpacing: 3, color: 'var(--color-accent)', fontWeight: 700 }}>{title}</span>
    </div>
  )
}

export function StatRowA({ label, h, a, isPercent = false, hideWhenZero = false }: SBProps) {
  if (hideWhenZero && h === 0 && a === 0) return null
  const total = h + a || 1
  const homePct = (h / total) * 100
  const fmtH = isPercent ? `${h.toFixed(0)}%` : h
  const fmtA = isPercent ? `${a.toFixed(0)}%` : a
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '0.5px solid #1c1c1c', gap: 18 }}>
      <span style={{ fontSize: 24, fontWeight: 800, color: '#f5f0e8', width: 70, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {fmtH}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#555', letterSpacing: 2.5, textAlign: 'center', textTransform: 'uppercase', marginBottom: 7 }}>
          {label}
        </div>
        <div style={{ height: 5, background: '#232323', borderRadius: 3, overflow: 'hidden' }}>
          <div className="bar-anim" style={{ width: `${homePct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '3px 0 0 3px' }} />
        </div>
      </div>
      <span style={{ fontSize: 24, color: '#666', width: 70, textAlign: 'left', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {fmtA}
      </span>
    </div>
  )
}

/* ── Stats Variant B – Stacked Dual Bars ─────────────────────────── */
export function StatSectionB({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 3, color: '#999', borderBottom: '2px solid #111', paddingBottom: 5, marginTop: 22, marginBottom: 4 }}>
      {title}
    </div>
  )
}

export function StatBarB({ label, h, a, homeAbbr, awayAbbr, isPercent = false, hideWhenZero = false }: SBProps & { homeAbbr: string; awayAbbr: string }) {
  if (hideWhenZero && h === 0 && a === 0) return null
  const maxVal = Math.max(h, a) || 1
  const homeFill = (h / maxVal) * 100
  const awayFill = (a / maxVal) * 100
  const fmtH = isPercent ? `${h.toFixed(0)}%` : h
  const fmtA = isPercent ? `${a.toFixed(0)}%` : a
  return (
    <div style={{ padding: '11px 0', borderBottom: '0.5px solid #e8e2d8' }}>
      <div style={{ fontSize: 9, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 9 }}>{label}</div>
      {/* Home bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#555', width: 30, flexShrink: 0 }}>{homeAbbr}</span>
        <div style={{ flex: 1, height: 9, background: '#ede8df', borderRadius: 5, overflow: 'hidden' }}>
          <div className="bar-anim" style={{ width: `${homeFill}%`, height: '100%', background: '#111', borderRadius: 5 }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#111', width: 48, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmtH}
        </span>
      </div>
      {/* Away bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 9, color: '#aaa', width: 30, flexShrink: 0 }}>{awayAbbr}</span>
        <div style={{ flex: 1, height: 9, background: '#ede8df', borderRadius: 5, overflow: 'hidden' }}>
          <div className="bar-anim" style={{ width: `${awayFill}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 5, opacity: 0.75 }} />
        </div>
        <span style={{ fontSize: 15, color: '#888', width: 48, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmtA}
        </span>
      </div>
    </div>
  )
}

/* ── Stats default (fallback) ───────────────────────────────────── */
export function StatSectionDef({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 3, color: '#999', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 4, marginTop: 20 }}>
      {title}
    </div>
  )
}

export function StatBarDef({ label, h, a, isPercent = false, hideWhenZero = false }: SBProps) {
  if (hideWhenZero && h === 0 && a === 0) return null
  const total = h + a || 1
  const homePct = (h / total) * 100
  const fmtH = isPercent ? `${h.toFixed(0)}%` : h
  const fmtA = isPercent ? `${a.toFixed(0)}%` : a
  return (
    <div style={{ padding: '8px 0', borderBottom: '0.5px solid #e8e2d8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#111', minWidth: 48, textAlign: 'left' }}>{fmtH}</span>
        <span style={{ fontSize: 9, color: '#999', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', flex: 1 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#777', minWidth: 48, textAlign: 'right' }}>{fmtA}</span>
      </div>
      <div style={{ height: 4, background: '#e8e2d8', borderRadius: 2, overflow: 'hidden' }}>
        <div className="bar-anim" style={{ width: `${homePct}%`, height: '100%', background: '#111', borderRadius: '2px 0 0 2px' }} />
      </div>
    </div>
  )
}

/* ── BSD Stats Components ─────────────────────────────────────────── */

export function BsdSection({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 36, marginBottom: 2, paddingTop: 18, borderTop: '1px solid #1e1e1e' }}>
      <div style={{ width: 3, height: 14, background: 'var(--color-accent)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, letterSpacing: 3, color: 'var(--color-accent)', fontWeight: 700 }}>{title}</span>
    </div>
  )
}

export function BsdStatRow({ label, h, a, isPercent, fmt, hideWhenZero }: {
  label: string; h: number; a: number
  isPercent?: boolean; fmt?: (v: number) => string; hideWhenZero?: boolean
}) {
  if (hideWhenZero && h === 0 && a === 0) return null
  const total = h + a || 1
  const homePct = (h / total) * 100
  const display = fmt ?? ((v: number) => isPercent ? `${v.toFixed(0)}%` : String(v))
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', gap: 16 }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: '#f5f0e8', width: 76, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {display(h)}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#777', letterSpacing: 2.5, textAlign: 'center', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
          <div className="bar-anim" style={{ width: `${homePct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '2px 0 0 2px' }} />
        </div>
      </div>
      <span style={{ fontSize: 22, fontWeight: 800, color: '#c8c8c8', width: 76, textAlign: 'left', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {display(a)}
      </span>
    </div>
  )
}

export function BsdFracRow({ label, h, a, hideWhenZero }: {
  label: string; h: BsdFractionStat; a: BsdFractionStat; hideWhenZero?: boolean
}) {
  if (hideWhenZero && h.total === 0 && a.total === 0) return null
  const hRatio = h.total > 0 ? h.value / h.total : 0
  const aRatio = a.total > 0 ? a.value / a.total : 0
  const totalRatio = hRatio + aRatio || 1
  const barPct = (hRatio / totalRatio) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', gap: 16 }}>
      <div style={{ width: 76, textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#f5f0e8', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {h.value}/{h.total}
        </div>
        <div style={{ fontSize: 9, color: 'var(--color-accent)' }}>{h.pct}%</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#777', letterSpacing: 2.5, textAlign: 'center', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
        <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
          <div className="bar-anim" style={{ width: `${barPct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '2px 0 0 2px' }} />
        </div>
      </div>
      <div style={{ width: 76, textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#c8c8c8', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {a.value}/{a.total}
        </div>
        <div style={{ fontSize: 9, color: '#c8c8c8', opacity: 0.6 }}>{a.pct}%</div>
      </div>
    </div>
  )
}
