'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PlayerMatchHistoryRow } from '@/lib/data'

const INITIAL_SHOWN = 10

function ratingColor(r: number | null): string {
  if (r == null) return '#888'
  if (r >= 8) return '#22c55e'
  if (r >= 7) return '#f59e0b'
  if (r >= 6) return '#aaa'
  return '#ef4444'
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function pct(a: number | null, b: number | null): string {
  if (a == null || !b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

const TH: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 9,
  letterSpacing: 1.5,
  color: '#888',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  borderBottom: '2px solid #e8e2d8',
  textAlign: 'center',
  background: '#faf8f4',
}
const TD: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 11,
  color: '#444',
  borderBottom: '1px solid #f0ece4',
  whiteSpace: 'nowrap',
  textAlign: 'center',
}

export default function PlayerMatchHistory({ rows }: { rows: PlayerMatchHistoryRow[] }) {
  const [shown, setShown] = useState(INITIAL_SHOWN)
  if (!rows.length) return null

  const visible = rows.slice(0, shown)

  return (
    <div className="bg-surface border border-muted mt-3">
      <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 px-4 pt-4 mb-0">
        MATCH HISTORY
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', paddingLeft: 16 }}>DATE</th>
              <th style={{ ...TH, textAlign: 'left' }}>MATCH</th>
              <th style={TH}>ROUND</th>
              <th style={TH}>MIN</th>
              <th style={TH}>RTG</th>
              <th style={TH}>G</th>
              <th style={TH}>A</th>
              <th style={TH}>xG</th>
              <th style={TH}>SH</th>
              <th style={TH}>KP</th>
              <th style={TH}>PASS%</th>
              <th style={TH}>TKL</th>
              <th style={TH}>DLS</th>
              <th style={{ ...TH, paddingRight: 16 }}>CARDS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => {
              const score = m.home_score != null && m.away_score != null
                ? `${m.home_score}–${m.away_score}` : null
              const duels = (m.duel_won ?? 0) + (m.duel_lost ?? 0)
              const cards = [
                m.yellow_card ? '🟨'.repeat(Math.min(m.yellow_card, 2)) : '',
                m.red_card    ? '🟥'.repeat(Math.min(m.red_card, 1))    : '',
              ].join('')

              return (
                <tr key={m.event_id} className="hover:bg-[#faf8f4] transition-colors">
                  <td style={{ ...TD, textAlign: 'left', paddingLeft: 16 }}>
                    <Link href={`/matches/${m.event_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {fmtDate(m.event_date)}
                    </Link>
                  </td>
                  <td style={{ ...TD, textAlign: 'left', maxWidth: 180 }}>
                    <Link href={`/matches/${m.event_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <span style={{ color: '#222' }}>
                        {m.home_team} vs {m.away_team}
                      </span>
                      {score && (
                        <span style={{ color: '#bbb', marginLeft: 6, fontSize: 10 }}>{score}</span>
                      )}
                    </Link>
                  </td>
                  <td style={{ ...TD, fontSize: 9, color: '#bbb' }}>
                    {m.group_name || m.round_name || '—'}
                  </td>
                  <td style={TD}>
                    {m.minutes_played != null ? `${m.minutes_played}'` : '—'}
                  </td>
                  <td style={{
                    ...TD,
                    fontFamily: 'var(--font-bebas, sans-serif)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: ratingColor(m.rating),
                  }}>
                    {m.rating != null ? m.rating.toFixed(1) : '—'}
                  </td>
                  <td style={{
                    ...TD,
                    fontWeight: (m.goals ?? 0) > 0 ? 700 : 400,
                    color: (m.goals ?? 0) > 0 ? 'var(--color-accent)' : '#bbb',
                  }}>
                    {(m.goals ?? 0) > 0 ? m.goals : '—'}
                  </td>
                  <td style={{
                    ...TD,
                    color: (m.goal_assist ?? 0) > 0 ? '#333' : '#bbb',
                  }}>
                    {(m.goal_assist ?? 0) > 0 ? m.goal_assist : '—'}
                  </td>
                  <td style={TD}>
                    {m.expected_goals != null ? m.expected_goals.toFixed(2) : '—'}
                  </td>
                  <td style={TD}>{m.total_shots ?? '—'}</td>
                  <td style={TD}>{m.key_pass ?? '—'}</td>
                  <td style={TD}>{pct(m.accurate_pass, m.total_pass)}</td>
                  <td style={TD}>
                    {m.won_tackle != null ? `${m.won_tackle}/${m.total_tackle ?? '?'}` : '—'}
                  </td>
                  <td style={TD}>
                    {duels > 0 ? `${m.duel_won ?? 0}/${duels}` : '—'}
                  </td>
                  <td style={{ ...TD, paddingRight: 16 }}>
                    {cards || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rows.length > shown && (
        <div className="px-4 py-3 border-t border-[#f0ece4] text-center">
          <button
            onClick={() => setShown(rows.length)}
            className="text-[10px] tracking-[2px] font-bold text-ink-faint hover:text-ink uppercase transition-colors"
          >
            SHOW ALL {rows.length} MATCHES ↓
          </button>
        </div>
      )}
    </div>
  )
}
