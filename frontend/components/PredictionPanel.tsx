import type { MatchPrediction } from '@/lib/predictions'

/* Renders pre-match probability bar only.
   Returns null when there is no probability data. */
export default function PredictionPanel({
  pred, homeTeam, awayTeam,
}: {
  pred:     MatchPrediction
  homeTeam: string
  awayTeam: string
}) {
  if (pred.prob_home_win == null) return null

  const hw = pred.prob_home_win ?? 0
  const dw = pred.prob_draw     ?? 0
  const aw = pred.prob_away_win ?? 0

  const colLabel: React.CSSProperties = {
    fontSize: 9, letterSpacing: 3, color: '#999',
    borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 14,
  }

  return (
    <div style={{ background: '#f5f0e8', borderTop: '1px solid #ddd8cc' }}>
      <div style={{ padding: '16px 20px' }}>
        <div style={colLabel}>PRE-MATCH PREDICTION</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', letterSpacing: 1, marginBottom: 4 }}>
          <span>{homeTeam.toUpperCase()}</span>
          {pred.most_likely_score && (
            <span style={{ color: '#888' }}>Predicted: {pred.most_likely_score}</span>
          )}
          <span>{awayTeam.toUpperCase()}</span>
        </div>

        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: 6 }}>
          <div style={{ flex: hw, background: '#111', borderRadius: '3px 0 0 3px', minWidth: hw > 0 ? 4 : 0 }} />
          <div style={{ flex: dw, background: '#888' }} />
          <div style={{ flex: aw, background: '#555', borderRadius: '0 3px 3px 0', minWidth: aw > 0 ? 4 : 0 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999' }}>
          <span style={{ color: '#111', fontWeight: 700 }}>{hw.toFixed(1)}%</span>
          <span style={{ color: '#aaa' }}>Draw {dw.toFixed(1)}%</span>
          <span>{aw.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
