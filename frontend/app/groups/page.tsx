import { getGroupStandings, getKnockoutMatches, getKnockoutStartDate } from '@/lib/data'
import StageTabsClient from '@/components/StageTabsClient'
import type { GroupTeamStat } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const [standings, knockoutMatches, knockoutStartDate] = await Promise.all([
    getGroupStandings(),
    getKnockoutMatches(),
    getKnockoutStartDate(),
  ])

  const sortedGroups: [string, GroupTeamStat[]][] = Object.entries(standings).sort(
    ([a], [b]) => a.localeCompare(b)
  )

  // Auto-switch: if today >= first knockout match date, open Knockout tab by default
  const defaultStage =
    knockoutStartDate && new Date() >= new Date(knockoutStartDate)
      ? 'knockout'
      : 'group-stage'

  return (
    <div>
      <div className="sec-head">STANDINGS</div>
      <p className="text-[12px] text-ink-faint mb-6 tracking-[0.5px]">
        48 teams · 12 groups · Top 2 from each group advance to Round of 32
      </p>

      <StageTabsClient
        sortedGroups={sortedGroups}
        knockoutMatches={knockoutMatches}
        defaultStage={defaultStage as 'group-stage' | 'knockout'}
      />
    </div>
  )
}
