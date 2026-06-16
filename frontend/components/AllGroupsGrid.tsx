import FlagImg from './FlagImg'
import Link from 'next/link'
import type { GroupTeamStat } from '@/lib/types'
import styles from './AllGroupsGrid.module.css'

interface Props {
  sortedGroups: [string, GroupTeamStat[]][]
}

const FC: Record<string, string> = { W: '#16a34a', D: '#d97706', L: '#dc2626' }

function FormBadge({ r }: { r: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 17, height: 17, borderRadius: 2,
      background: FC[r] ?? '#444',
      fontSize: 8, fontWeight: 800, color: '#fff',
      flexShrink: 0,
    }}>{r}</span>
  )
}

function GroupTable({ groupName, teams }: { groupName: string; teams: GroupTeamStat[] }) {
  const letter = groupName.replace('Group ', '')
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', overflow: 'hidden' }}>
      {/* Group header */}
      <div style={{ background: '#0a0a0a', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', color: 'var(--color-accent)', fontSize: 20, letterSpacing: 3 }}>
          GROUP {letter}
        </span>
        <span style={{ fontSize: 8, color: '#777', letterSpacing: 2 }}>{teams.length} TEAMS</span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            {['#', 'TEAM', 'P', 'W', 'D', 'L', 'GD', 'PTS', 'FORM'].map((h, i) => (
              <th key={h} style={{
                padding: '6px 4px',
                textAlign: i === 1 ? 'left' : i === 8 ? 'right' : 'center',
                color: '#777', fontWeight: 'normal', fontSize: 8, letterSpacing: 1.5,
                width: i === 0 ? 22 : i === 1 ? undefined : i === 7 ? 34 : i === 8 ? 62 : 24,
                paddingLeft: i === 0 ? 12 : undefined,
                paddingRight: i === 8 ? 10 : undefined,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.team_id} style={{ borderBottom: '1px solid #181818' }}>
              {/* Rank */}
              <td style={{ padding: '9px 4px 9px 12px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i < 2
                    ? <span style={{ display: 'inline-block', width: 3, height: 12, background: 'var(--color-accent)', borderRadius: 1, flexShrink: 0 }} />
                    : <span style={{ display: 'inline-block', width: 3 }} />}
                  <span style={{ color: '#888', fontSize: 10 }}>{i + 1}</span>
                </div>
              </td>
              {/* Team */}
              <td style={{ padding: '9px 4px' }}>
                <Link href={'/teams/' + t.team_id} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                  <FlagImg country={t.team_name} width={18} />
                  <span style={{ color: '#eee', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.team_name}
                  </span>
                </Link>
              </td>
              {/* Stats */}
              <td style={{ padding: '9px 4px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.played}</td>
              <td style={{ padding: '9px 4px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.won}</td>
              <td style={{ padding: '9px 4px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.drawn}</td>
              <td style={{ padding: '9px 4px', textAlign: 'center', color: '#aaa', fontSize: 12 }}>{t.lost}</td>
              <td style={{ padding: '9px 4px', textAlign: 'center', fontSize: 12, color: t.gd > 0 ? '#f5f0e8' : t.gd < 0 ? '#777' : '#aaa' }}>
                {t.gd > 0 ? '+' + t.gd : t.gd}
              </td>
              {/* PTS */}
              <td style={{ padding: '9px 4px', textAlign: 'center', fontWeight: 900, fontSize: 16, color: '#f5f0e8', fontVariantNumeric: 'tabular-nums' }}>{t.pts}</td>
              {/* Form — newest first, last column */}
              <td style={{ padding: '9px 12px 9px 4px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  {t.form.map((r, fi) => <FormBadge key={fi} r={r} />)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Qualify legend */}
      <div style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5, borderTop: '1px solid #1e1e1e' }}>
        <span style={{ display: 'inline-block', width: 3, height: 8, background: 'var(--color-accent)', borderRadius: 1 }} />
        <span style={{ fontSize: 7, color: '#666', letterSpacing: 1.5 }}>ADVANCE TO ROUND OF 32</span>
      </div>
    </div>
  )
}

export default function AllGroupsGrid({ sortedGroups }: Props) {
  return (
    <div className={styles.grid}>
      {sortedGroups.map(([groupName, teams]) => (
        <GroupTable key={groupName} groupName={groupName} teams={teams} />
      ))}
    </div>
  )
}
