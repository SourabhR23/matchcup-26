'use client'

import { useState } from 'react'
import Link from 'next/link'
import FlagImg from './FlagImg'
import type { GroupTeamStat } from '@/lib/types'

interface Props {
  groups: [string, GroupTeamStat[]][]
}

const FC: Record<string, string> = { W: '#16a34a', D: '#d97706', L: '#dc2626' }

function FormBadge({ r }: { r: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: 3,
      background: FC[r] ?? '#444',
      fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>{r}</span>
  )
}

export default function HomeStandingsWidget({ groups }: Props) {
  const [active, setActive] = useState(groups[0]?.[0] ?? '')
  const teams = groups.find(([g]) => g === active)?.[1] ?? []

  return (
    <div>
      {/* Section head — mirrors UPCOMING MATCHES style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #111', paddingBottom: 6, marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 28, letterSpacing: 2, color: '#111', margin: 0 }}>STANDINGS</h2>
        <Link href="/groups" style={{ fontSize: 9, color: '#111', letterSpacing: 1.5, textDecoration: 'none', fontWeight: 700, marginBottom: 4 }}>
          FULL VIEW →
        </Link>
      </div>

      {/* Group tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {groups.map(([g]) => {
          const on = g === active
          return (
            <button key={g} onClick={() => setActive(g)} style={{
              padding: '4px 10px',
              background: on ? '#111' : 'transparent',
              color: on ? 'var(--color-accent)' : '#777',
              border: on ? '1px solid #111' : '1px solid #ddd8cc',
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              letterSpacing: 1, whiteSpace: 'nowrap',
              transition: 'all 0.12s',
            }}>{g}</button>
          )
        })}
      </div>

      {/* Dark table */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222' }}>
              {['#', 'TEAM', 'P', 'W', 'D', 'L', 'GD', 'PTS', 'FORM'].map((h, i) => (
                <th key={h} style={{
                  padding: '7px 5px',
                  textAlign: i === 1 ? 'left' : i === 8 ? 'right' : 'center',
                  color: '#888', fontWeight: 'normal', fontSize: 8, letterSpacing: 2,
                  width: i === 0 ? 30 : i === 1 ? undefined : i === 7 ? 44 : i === 8 ? 72 : 28,
                  paddingLeft: i === 0 ? 14 : undefined,
                  paddingRight: i === 8 ? 14 : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.team_id} style={{ borderBottom: '1px solid #181818' }}>
                {/* Rank */}
                <td style={{ padding: '10px 5px 10px 14px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {i < 2
                      ? <span style={{ display: 'inline-block', width: 3, height: 13, background: 'var(--color-accent)', borderRadius: 1, flexShrink: 0 }} />
                      : <span style={{ display: 'inline-block', width: 3 }} />}
                    <span style={{ color: '#999', fontSize: 11 }}>{i + 1}</span>
                  </div>
                </td>
                {/* Team */}
                <td style={{ padding: '10px 5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FlagImg country={t.team_name} width={20} />
                    <span style={{ color: '#ddd', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.team_name}</span>
                  </div>
                </td>
                {/* Stats */}
                <td style={{ padding: '10px 5px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.played}</td>
                <td style={{ padding: '10px 5px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.won}</td>
                <td style={{ padding: '10px 5px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.drawn}</td>
                <td style={{ padding: '10px 5px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.lost}</td>
                <td style={{ padding: '10px 5px', textAlign: 'center', fontSize: 12, color: t.gd > 0 ? '#f5f0e8' : t.gd < 0 ? '#777' : '#aaa' }}>
                  {t.gd > 0 ? '+' + t.gd : t.gd}
                </td>
                {/* PTS */}
                <td style={{ padding: '10px 5px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#f5f0e8', fontVariantNumeric: 'tabular-nums' }}>
                  {t.pts}
                </td>
                {/* FORM last — newest first, max 3 */}
                <td style={{ padding: '10px 14px 10px 5px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {t.form.slice(0, 3).map((r, fi) => <FormBadge key={fi} r={r} />)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5, borderTop: '1px solid #1e1e1e' }}>
          <span style={{ display: 'inline-block', width: 3, height: 9, background: 'var(--color-accent)', borderRadius: 1 }} />
          <span style={{ fontSize: 8, color: '#777', letterSpacing: 1.5 }}>TOP 2 ADVANCE TO ROUND OF 32</span>
        </div>
      </div>
    </div>
  )
}
