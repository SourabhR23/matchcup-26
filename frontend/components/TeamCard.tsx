import Link from 'next/link'
import FlagImg from '@/components/FlagImg'
import type { Team } from '@/lib/types'

interface TeamCardProps {
  team: Team
  group?: string
}

export default function TeamCard({ team, group }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`} className="team-row block">
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e8e2d8', background: '#f5f0e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FlagImg country={team.name} width={42} />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-ink">{team.name}</div>
        <div className="text-[10px] text-ink-faint tracking-[0.5px] mt-0.5">
          {team.coach?.name ?? ''}
        </div>
      </div>
      {group && (
        <span className="font-display text-lg text-ink-ghost tracking-[1px]">{group}</span>
      )}
    </Link>
  )
}
