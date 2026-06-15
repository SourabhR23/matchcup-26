'use client'

import type { MatchTabsProps } from '../types'

type Pred = NonNullable<MatchTabsProps['prediction']>

interface Props {
  prediction: Pred
  homeTeam: string
  awayTeam: string
  homeAbbr: string
  awayAbbr: string
}

function ProbBar({ value, max = 100, accent = false }: { value: number; max?: number; accent?: boolean }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ flex: 1, height: 6, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: accent ? 'var(--color-accent)' : '#555', borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  )
}

function RecommendBadge({ on }: { on: boolean | null }) {
  if (!on) return null
  return (
    <span style={{ fontSize: 8, letterSpacing: 1.5, fontWeight: 700, color: '#16a34a', background: '#0a1a0a', padding: '2px 7px', borderRadius: 2, flexShrink: 0 }}>
      LIKELY
    </span>
  )
}

function MarketRow({ label, value, recommend }: { label: string; value: number | null; recommend: boolean | null }) {
  if (value == null) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontSize: 11, color: '#666', width: 80, flexShrink: 0 }}>{label}</span>
      <ProbBar value={value} accent={!!recommend} />
      <span style={{ fontSize: 14, fontWeight: 800, color: recommend ? '#f0ece4' : '#555', width: 46, textAlign: 'right', flexShrink: 0 }}>
        {value.toFixed(1)}%
      </span>
      <div style={{ width: 56, flexShrink: 0 }}>
        <RecommendBadge on={recommend} />
      </div>
    </div>
  )
}

export default function PredictionTab({ prediction, homeTeam, awayTeam, homeAbbr, awayAbbr }: Props) {
  const hw = prediction.probHomeWin ?? 0
  const dw = prediction.probDraw    ?? 0
  const aw = prediction.probAwayWin ?? 0

  const resultLabel = (r: string | null | undefined) =>
    r === 'H' ? homeTeam + ' Win' : r === 'A' ? awayTeam + ' Win' : 'Draw'

  const hasGoalMarkets = prediction.probOver15 != null || prediction.probOver25 != null || prediction.probOver35 != null || prediction.probBttsYes != null
  const hasXg = prediction.expectedHomeGoals != null && prediction.expectedAwayGoals != null
  const hasFunfacts = prediction.funfacts?.length > 0

  return (
    <div style={{ background: '#111', minHeight: 400 }}>

      {/* ── SECTION 1: Win probability ─────────────────────────────── */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1c1c1c', padding: '28px 24px 24px' }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: '#444', fontWeight: 700, marginBottom: 20 }}>MATCH OUTCOME</div>

        {/* Three big boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {/* Home */}
          <div style={{ background: prediction.predictedResult === 'H' ? '#1a0000' : '#111', border: `1px solid ${prediction.predictedResult === 'H' ? 'var(--color-accent)' : '#1e1e1e'}`, padding: '18px 16px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: prediction.predictedResult === 'H' ? 'var(--color-accent)' : '#444', marginBottom: 10, fontWeight: 700 }}>
              {homeAbbr} WIN {prediction.predictedResult === 'H' && '★'}
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: prediction.predictedResult === 'H' ? '#f0ece4' : '#555', lineHeight: 1, letterSpacing: -2 }}>
              {hw.toFixed(0)}<span style={{ fontSize: 20, color: '#444' }}>%</span>
            </div>
            <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, marginTop: 12 }}>
              <div style={{ width: `${hw}%`, height: '100%', background: prediction.predictedResult === 'H' ? 'var(--color-accent)' : '#333', borderRadius: 2 }} />
            </div>
          </div>

          {/* Draw */}
          <div style={{ background: prediction.predictedResult === 'D' ? '#121212' : '#111', border: `1px solid ${prediction.predictedResult === 'D' ? '#555' : '#1e1e1e'}`, padding: '18px 16px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: prediction.predictedResult === 'D' ? '#aaa' : '#444', marginBottom: 10, fontWeight: 700 }}>
              DRAW {prediction.predictedResult === 'D' && '★'}
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: prediction.predictedResult === 'D' ? '#f0ece4' : '#444', lineHeight: 1, letterSpacing: -2 }}>
              {dw.toFixed(0)}<span style={{ fontSize: 20, color: '#333' }}>%</span>
            </div>
            <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, marginTop: 12 }}>
              <div style={{ width: `${dw}%`, height: '100%', background: prediction.predictedResult === 'D' ? '#666' : '#2a2a2a', borderRadius: 2 }} />
            </div>
          </div>

          {/* Away */}
          <div style={{ background: prediction.predictedResult === 'A' ? '#0d0d0d' : '#111', border: `1px solid ${prediction.predictedResult === 'A' ? '#555' : '#1e1e1e'}`, padding: '18px 16px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: prediction.predictedResult === 'A' ? '#aaa' : '#444', marginBottom: 10, fontWeight: 700 }}>
              {awayAbbr} WIN {prediction.predictedResult === 'A' && '★'}
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: prediction.predictedResult === 'A' ? '#f0ece4' : '#444', lineHeight: 1, letterSpacing: -2 }}>
              {aw.toFixed(0)}<span style={{ fontSize: 20, color: '#333' }}>%</span>
            </div>
            <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, marginTop: 12 }}>
              <div style={{ width: `${aw}%`, height: '100%', background: prediction.predictedResult === 'A' ? '#888' : '#2a2a2a', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Combined bar + info row */}
        <div>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
            <div style={{ flex: hw, background: 'var(--color-accent)', minWidth: hw > 0 ? 4 : 0 }} />
            <div style={{ flex: dw, background: '#333', minWidth: dw > 0 ? 4 : 0 }} />
            <div style={{ flex: aw, background: '#222', minWidth: aw > 0 ? 4 : 0 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {prediction.mostLikelyScore && (
                <span style={{ fontSize: 10, color: '#555' }}>
                  Predicted score: <strong style={{ color: '#888' }}>{prediction.mostLikelyScore}</strong>
                </span>
              )}
              {prediction.predictedResult && (
                <span style={{ fontSize: 10, color: '#555' }}>
                  Tip: <strong style={{ color: 'var(--color-accent)' }}>{resultLabel(prediction.predictedResult)}</strong>
                </span>
              )}
            </div>
            {prediction.confidence != null && (
              <span style={{ fontSize: 9, letterSpacing: 1, color: '#444' }}>
                Confidence {prediction.confidence.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2 + 3: Goal markets + xG ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: hasXg ? '1fr 1fr' : '1fr', gap: 0, borderBottom: '1px solid #1c1c1c' }}>

        {/* Goal markets */}
        {hasGoalMarkets && (
          <div style={{ padding: '22px 24px', borderRight: hasXg ? '1px solid #1c1c1c' : 'none' }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#444', fontWeight: 700, marginBottom: 4 }}>GOAL MARKETS</div>
            <MarketRow label="Over 1.5"  value={prediction.probOver15}  recommend={prediction.over15Recommend} />
            <MarketRow label="Over 2.5"  value={prediction.probOver25}  recommend={prediction.over25Recommend} />
            <MarketRow label="Over 3.5"  value={prediction.probOver35}  recommend={prediction.over35Recommend} />
            <MarketRow label="Both Score" value={prediction.probBttsYes} recommend={prediction.bttsRecommend} />
          </div>
        )}

        {/* xG comparison */}
        {hasXg && (
          <div style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#444', fontWeight: 700, marginBottom: 18 }}>EXPECTED GOALS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: '#666', width: 40, flexShrink: 0 }}>{homeAbbr}</span>
              <ProbBar value={prediction.expectedHomeGoals!} max={Math.max(prediction.expectedHomeGoals!, prediction.expectedAwayGoals!) * 1.2} accent />
              <span style={{ fontSize: 22, fontWeight: 900, color: '#f0ece4', width: 42, textAlign: 'right', flexShrink: 0 }}>
                {prediction.expectedHomeGoals!.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, color: '#666', width: 40, flexShrink: 0 }}>{awayAbbr}</span>
              <ProbBar value={prediction.expectedAwayGoals!} max={Math.max(prediction.expectedHomeGoals!, prediction.expectedAwayGoals!) * 1.2} />
              <span style={{ fontSize: 22, fontWeight: 900, color: '#888', width: 42, textAlign: 'right', flexShrink: 0 }}>
                {prediction.expectedAwayGoals!.toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: 9, color: '#333', marginTop: 16, letterSpacing: 1 }}>
              PRE-MATCH EXPECTED GOALS
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 4: AI Preview ──────────────────────────────────── */}
      {prediction.aiPreview && (
        <div style={{ padding: '24px 24px', borderBottom: '1px solid #1c1c1c' }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#444', fontWeight: 700, marginBottom: 16 }}>AI MATCH PREVIEW</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {prediction.aiPreview}
          </div>
        </div>
      )}

      {/* ── SECTION 5: Fun Facts ───────────────────────────────────── */}
      {hasFunfacts && (
        <div style={{ padding: '24px 24px 32px' }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#444', fontWeight: 700, marginBottom: 16 }}>MATCH FACTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prediction.funfacts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: 'var(--color-accent)', marginTop: 3, flexShrink: 0, letterSpacing: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>{fact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback when no rich data */}
      {!hasGoalMarkets && !hasXg && !prediction.aiPreview && !hasFunfacts && (
        <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 12, color: '#444' }}>
          Pre-match prediction data not available for this fixture.
        </div>
      )}

    </div>
  )
}
