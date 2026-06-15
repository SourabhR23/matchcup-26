import type { Incident } from '@/lib/types'

interface TimelineProps {
  incidents: Incident[]
  homeTeam: string
  awayTeam: string
  homeLabel?: string
  awayLabel?: string
}

function IncidentIcon({ type, cardType }: { type: string; cardType?: string }) {
  if (type === 'goal') return <span style={{ fontSize: 14 }}>⚽</span>
  if (type === 'card') {
    if (cardType === 'red')
      return <span style={{ display: 'inline-block', width: 10, height: 14, background: 'var(--color-danger)', borderRadius: 1, flexShrink: 0 }} />
    return <span style={{ display: 'inline-block', width: 10, height: 14, background: 'var(--color-warning)', borderRadius: 1, flexShrink: 0 }} />
  }
  if (type === 'substitution') return <span style={{ fontSize: 13 }}>↕</span>
  if (type === 'varDecision') return <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>VAR</span>
  return null
}

function minuteLabel(inc: Incident) {
  if (inc.added_time) return `${inc.minute}+${inc.added_time}'`
  return `${inc.minute}'`
}

function EventContent({ inc, align }: { inc: Incident; align: 'left' | 'right' }) {
  const isRight = align === 'right'
  const playerName = inc.type === 'substitution'
    ? (inc.player_in ?? inc.player)
    : inc.player

  return (
    <div style={{ textAlign: isRight ? 'left' : 'right' }}>
      {playerName && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0ece4', lineHeight: 1.3 }}>
          {playerName}
        </div>
      )}
      {inc.type === 'goal' && inc.assist && (
        <div style={{ fontSize: 11, color: '#888' }}>assist: {inc.assist}</div>
      )}
      {inc.type === 'substitution' && inc.player_out && (
        <div style={{ fontSize: 11, color: '#cc0000' }}>↓ {inc.player_out}</div>
      )}
      {inc.type === 'varDecision' && inc.decision && (
        <div style={{ fontSize: 11, color: '#3b82f6' }}>{inc.decision}</div>
      )}
    </div>
  )
}

type Row = { kind: 'incident'; inc: Incident } | { kind: 'divider'; text: string; score: string }

export default function IncidentTimeline({ incidents, homeTeam, awayTeam, homeLabel, awayLabel }: TimelineProps) {
  void homeTeam; void awayTeam

  const rows: Row[] = []
  let htInserted = false

  for (const inc of incidents) {
    if (inc.type === 'injuryTime') continue

    if (inc.type === 'period') {
      if (inc.text !== 'HT') {
        rows.push({ kind: 'divider', text: inc.text ?? '', score: `${inc.home_score}–${inc.away_score}` })
      }
      continue
    }

    if (!htInserted && inc.minute && inc.minute >= 46 && !inc.added_time) {
      const htInc = incidents.find(i => i.type === 'period' && i.text === 'HT')
      if (htInc) {
        rows.push({ kind: 'divider', text: 'HT', score: `${htInc.home_score}–${htInc.away_score}` })
      }
      htInserted = true
    }

    rows.push({ kind: 'incident', inc })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Column labels */}
      {(homeLabel || awayLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#f0ece4', letterSpacing: 1.5 }}>{homeLabel}</span>
          <div style={{ width: 72, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: 1.5, textAlign: 'right' }}>{awayLabel}</span>
        </div>
      )}

      {/* Center vertical spine */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% - 0.5px)',
        top: homeLabel ? 36 : 0,
        bottom: 0,
        width: 1,
        background: '#2a2a2a',
        zIndex: 0,
      }} />

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 1 }}>
        {rows.map((row, idx) => {
          if (row.kind === 'divider') {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                <div style={{
                  background: '#1a1a1a', color: '#f5f0e8', border: '1px solid #2a2a2a',
                  fontSize: 11, letterSpacing: 2, padding: '4px 16px', fontWeight: 800,
                }}>
                  {row.text} · {row.score}
                </div>
              </div>
            )
          }

          const { inc } = row
          const isHome = inc.is_home === true
          const isGoal = inc.type === 'goal'

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', minHeight: 36 }}>
              {/* Left: home events */}
              <div style={{ flex: 1, paddingRight: 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {isHome && <EventContent inc={inc} align="left" />}
              </div>

              {/* Center badge */}
              <div style={{ width: 72, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: isGoal ? 'var(--color-accent)' : '#1a1a1a',
                  border: isGoal ? '1px solid var(--color-accent)' : '1px solid #2a2a2a',
                  padding: '4px 8px',
                  borderRadius: 2,
                }}>
                  <IncidentIcon type={inc.type} cardType={inc.card_type} />
                  <span style={{
                    fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: isGoal ? '#f5f0e8' : '#aaa',
                  }}>
                    {minuteLabel(inc)}
                  </span>
                </div>
                {isGoal && (
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-accent)', marginTop: 3 }}>
                    {inc.home_score}–{inc.away_score}
                  </span>
                )}
              </div>

              {/* Right: away events */}
              <div style={{ flex: 1, paddingLeft: 10, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                {!isHome && <EventContent inc={inc} align="right" />}
              </div>
            </div>
          )
        })}

        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#555' }}>
            No events recorded.
          </div>
        )}
      </div>
    </div>
  )
}
