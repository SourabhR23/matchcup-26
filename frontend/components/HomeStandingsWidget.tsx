'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FlagImg from './FlagImg'
import type { GroupTeamStat, Team } from '@/lib/types'

interface Props {
  groups: [string, GroupTeamStat[]][]
  teams: Team[]
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

export default function HomeStandingsWidget({ groups, teams }: Props) {
  const router   = useRouter()
  const [active, setActive] = useState(groups[0]?.[0] ?? '')
  const tableTeams = groups.find(([g]) => g === active)?.[1] ?? []

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  function handleTeamSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (id) router.push(`/teams/${id}`)
    e.target.value = ''
  }

  return (
    <div>
      {/* Section head */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: '3px solid #111', paddingBottom: 6, marginBottom: 12,
        gap: 10, flexWrap: 'wrap',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 28,
          letterSpacing: 2, color: '#111', margin: 0,
        }}>STANDINGS</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 48-team selector */}
          {sortedTeams.length > 0 && (
            <select
              onChange={handleTeamSelect}
              defaultValue=""
              style={{
                fontSize: 9, letterSpacing: 1, fontWeight: 700,
                color: '#111', background: 'transparent',
                border: '0.5px solid #bbb', padding: '3px 8px',
                cursor: 'pointer', outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="" disabled>SELECT TEAM</option>
              {sortedTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <Link
            href="/groups"
            style={{
              fontSize: 9, color: '#111', letterSpacing: 1.5,
              textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            FULL VIEW →
          </Link>
        </div>
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
            {tableTeams.map((t, i) => (
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

                {/* Team — clickable */}
                <td style={{ padding: '10px 5px' }}>
                  <Link
                    href={`/teams/${t.team_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      textDecoration: 'none',
                    }}
                  >
                    <FlagImg country={t.team_name} width={20} />
                    <span style={{
                      color: '#ddd', fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'color 0.12s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#ddd')}
                    >{t.team_name}</span>
                  </Link>
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

                {/* FORM */}
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
