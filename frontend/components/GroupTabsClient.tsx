'use client'

import { useState } from 'react'
import Link from 'next/link'
import FlagImg from './FlagImg'
import type { GroupTeamStat } from '@/lib/types'

interface GroupTabsClientProps {
  sortedGroups: [string, GroupTeamStat[]][]
}

export default function GroupTabsClient({ sortedGroups }: GroupTabsClientProps) {
  const [activeGroup, setActiveGroup] = useState(sortedGroups[0]?.[0] ?? '')
  const activeTeams = sortedGroups.find(([g]) => g === activeGroup)?.[1] ?? []
  const letter = activeGroup.replace('Group ', '')

  return (
    <div>
      {/* A–L tab row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {sortedGroups.map(([groupName]) => {
          const l        = groupName.replace('Group ', '')
          const isActive = groupName === activeGroup
          return (
            <button
              key={groupName}
              onClick={() => setActiveGroup(groupName)}
              style={{
                fontFamily: 'var(--font-bebas, sans-serif)',
                fontSize: 20,
                padding: '5px 14px',
                background: isActive ? '#111' : 'var(--color-surface)',
                color: isActive ? 'var(--color-accent)' : '#777',
                border: isActive ? '0.5px solid #111' : '0.5px solid #ddd8cc',
                cursor: 'pointer',
                letterSpacing: 2,
                transition: 'all 0.15s',
                minWidth: 44,
                textAlign: 'center',
              }}
            >
              {l}
            </button>
          )
        })}
      </div>

      {/* Active group card */}
      {activeTeams.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#999', fontSize: 12, letterSpacing: 1 }}>
          No standings data for Group {letter} yet.
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '0.5px solid #ddd8cc' }}>
          <div style={{ background: '#111', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', color: 'var(--color-accent)', fontSize: 22, letterSpacing: 2 }}>
              GROUP {letter}
            </span>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>{activeTeams.length} TEAMS</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e8e2d8', background: '#faf8f4' }}>
                {['#', 'TEAM', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'PTS'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '5px 6px',
                      textAlign: i === 1 ? 'left' : i === 9 ? 'right' : 'center',
                      color: '#999', fontWeight: 'normal', fontSize: 9, letterSpacing: 1,
                      width: i === 0 ? 22 : i === 1 ? undefined : i <= 5 ? 26 : 32,
                      paddingLeft: i === 0 ? 8 : undefined,
                      paddingRight: i === 9 ? 8 : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTeams.map((t, i) => (
                <tr key={t.team_id} style={{ borderBottom: '0.5px solid #f0ece4' }}>
                  <td style={{ padding: '6px 8px', color: '#999', whiteSpace: 'nowrap' }}>
                    {i < 2 && (
                      <span style={{ display: 'inline-block', width: 3, height: 12, background: 'var(--color-accent)', marginRight: 4, verticalAlign: 'middle' }} />
                    )}
                    {i + 1}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <Link
                      href={`/teams/${t.team_id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink)', fontWeight: 500, textDecoration: 'none' }}
                    >
                      <FlagImg country={t.team_name} width={20} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.team_name}</span>
                    </Link>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.played}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.won}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.drawn}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.lost}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.gf}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.ga}</td>
                  <td style={{ padding: '6px', textAlign: 'center', color: '#555' }}>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-ink)' }}>{t.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
