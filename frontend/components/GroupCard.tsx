import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { GroupTeamStat } from '@/lib/types'
import { getTeams } from '@/lib/data'

interface GroupCardProps {
  groupName: string
  teams: GroupTeamStat[]
}

export default async function GroupCard({ groupName, teams }: GroupCardProps) {
  const letter = groupName.replace('Group ', '')
  const allTeams = await getTeams()
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t]))

  return (
    <div className="group-card">
      <div className="group-card-head">
        <span className="font-display text-accent text-[22px] tracking-[2px]">GROUP {letter}</span>
        <span className="text-[9px] text-[#555] tracking-[1px]">{teams.length} TEAMS</span>
      </div>
      <table className="w-full border-collapse text-[11px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '0.5px solid #e8e2d8', background: '#faf8f4' }}>
            <th className="py-[5px] px-[8px] text-left text-[#999] font-normal text-[9px] tracking-[1px] w-5">#</th>
            <th className="py-[5px] px-[8px] text-left text-[#999] font-normal text-[9px] tracking-[1px]">TEAM</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-6">P</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-6">W</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-6">D</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-6">L</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-8">GF</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-8">GA</th>
            <th className="py-[5px] px-[6px] text-center text-[#999] font-normal text-[9px] tracking-[1px] w-8">GD</th>
            <th className="py-[5px] px-[6px] text-right text-[#999] font-normal text-[9px] tracking-[1px] w-8">PTS</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const teamData = teamMap[t.team_id]
            const teamName = teamData?.name ?? t.team_name
            const isQualifying = i < 2
            return (
              <tr key={t.team_id} style={{ borderBottom: '0.5px solid #f0ece4' }}>
                <td className="py-[6px] px-[8px] text-[#999] whitespace-nowrap">
                  {isQualifying && (
                    <span className="inline-block w-[3px] h-3 bg-accent mr-1 align-middle" />
                  )}
                  {i + 1}
                </td>
                <td className="py-[6px] px-[8px]">
                  <Link
                    href={`/teams/${t.team_id}`}
                    className="flex items-center gap-1.5 font-medium text-ink hover:text-accent transition-colors"
                  >
                    <FlagImg country={teamName} width={20} />
                    <span className="truncate">{t.team_name}</span>
                  </Link>
                </td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.played}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.won}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.drawn}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.lost}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.gf}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">{t.ga}</td>
                <td className="py-[6px] px-[6px] text-center text-[#555]">
                  {t.gd > 0 ? `+${t.gd}` : t.gd}
                </td>
                <td className="py-[6px] px-[6px] text-right font-bold text-ink">{t.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
