'use client'

import panelStyles from './StandingsPanel.module.css'
import FlagImg from '@/components/FlagImg'
import type { GroupTeamStat } from '@/lib/types'

const FORM_COLOR: Record<string, string> = { W: '#16a34a', D: '#d97706', L: '#dc2626' }

export function FormBadge({ result }: { result: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: 3,
      background: FORM_COLOR[result] ?? '#333',
      fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
      flexShrink: 0,
    }}>
      {result}
    </span>
  )
}

export default function StandingsPanel({ teams, groupName, homeTeam, awayTeam }: {
  teams: GroupTeamStat[]
  groupName?: string | null
  homeTeam: string
  awayTeam: string
}) {
  const letter = groupName?.replace('Group ', '') ?? ''
  const cols = ['#', 'TEAM', 'MP', 'W', 'D', 'L', 'GD', 'PTS', 'FORM']
  return (
    <div style={{ background: '#0d0d0d' }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e1e1e' }}>
        <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', color: 'var(--color-accent)', fontSize: 26, letterSpacing: 3 }}>
          {letter ? 'GROUP ' + letter : 'GROUP STANDINGS'}
        </span>
        <span style={{ fontSize: 11, color: '#888', letterSpacing: 2 }}>STANDINGS</span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            {cols.map((h, i) => (
              <th key={h} style={{
                padding: '8px 6px',
                textAlign: i === 1 ? 'left' : i === 8 ? 'right' : 'center',
                color: '#888', fontWeight: 'normal', fontSize: 8, letterSpacing: 2,
                width: i === 0 ? 28 : i === 1 ? undefined : i === 7 ? 42 : i === 8 ? 72 : 30,
                paddingLeft: i === 0 ? 14 : undefined,
                paddingRight: i === 8 ? 14 : undefined,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const isHome = t.team_name === homeTeam
            const isAway = t.team_name === awayTeam
            const isMatch = isHome || isAway
            const qualifies = i < 2
            return (
              <tr key={t.team_id} style={{
                borderBottom: '1px solid #1a1a1a',
                background: isMatch ? '#1c1500' : '#0d0d0d',
              }}>
                {/* Rank */}
                <td style={{ padding: '11px 6px 11px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {qualifies
                      ? <span style={{ display: 'inline-block', width: 3, height: 14, background: 'var(--color-accent)', borderRadius: 1, flexShrink: 0 }} />
                      : <span style={{ display: 'inline-block', width: 3, flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 11, color: '#999', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  </div>
                </td>
                {/* Team */}
                <td style={{ padding: '11px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FlagImg country={t.team_name} width={20} />
                    <span style={{
                      fontSize: 15, fontWeight: isMatch ? 700 : 400,
                      color: isMatch ? '#f5f0e8' : '#ddd',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.team_name}
                    </span>
                    {isMatch && (
                      <span style={{ fontSize: 7, background: 'var(--color-accent)', color: '#000', padding: '1px 5px', letterSpacing: 1.5, flexShrink: 0, fontWeight: 800 }}>
                        {isHome ? 'HOME' : 'AWAY'}
                      </span>
                    )}
                  </div>
                </td>
                {/* Stats */}
                <td style={{ padding: '11px 6px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.played}</td>
                <td style={{ padding: '11px 6px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.won}</td>
                <td style={{ padding: '11px 6px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.drawn}</td>
                <td style={{ padding: '11px 6px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.lost}</td>
                <td style={{ padding: '11px 6px', textAlign: 'center', fontSize: 12, color: t.gd > 0 ? '#f5f0e8' : t.gd < 0 ? '#777' : '#aaa' }}>
                  {t.gd > 0 ? '+' + t.gd : t.gd}
                </td>
                {/* PTS */}
                <td style={{ padding: '11px 6px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#f5f0e8', fontVariantNumeric: 'tabular-nums' }}>
                  {t.pts}
                </td>
                {/* Form — newest first, last column */}
                <td style={{ padding: '11px 14px 11px 6px', textAlign: 'right' }}>
                  <div className={panelStyles.formCol}>
                    {t.form.map((r, fi) => <FormBadge key={fi} result={r} />)}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 8, color: '#777', letterSpacing: 1.5, borderTop: '1px solid #1a1a1a' }}>
        <span style={{ display: 'inline-block', width: 3, height: 10, background: 'var(--color-accent)', borderRadius: 1 }} />
        TOP 2 ADVANCE TO ROUND OF 32
      </div>
    </div>
  )
}
