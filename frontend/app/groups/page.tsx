import { getGroupStandings } from '@/lib/data'
import AllGroupsGrid from '@/components/AllGroupsGrid'
import Link from 'next/link'
import type { GroupTeamStat } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const standings = await getGroupStandings()

  const sortedGroups: [string, GroupTeamStat[]][] = Object.entries(standings).sort(
    ([a], [b]) => a.localeCompare(b)
  )

  return (
    <div>
      <div className="sec-head">STANDINGS</div>
      <p className="text-[12px] text-ink-faint mb-6 tracking-[0.5px]">
        48 teams · 12 groups · Top 2 from each group advance to Round of 32
      </p>

      {sortedGroups.length === 0 ? (
        <div className="mt-8 bg-surface border border-muted p-6 text-center">
          <div className="font-display text-2xl tracking-[2px] mb-2">FIXTURES INCOMING</div>
          <p className="text-sm text-ink-faint">
            Group stage standings will appear here as matches are played.
          </p>
          <Link
            href="/matches"
            className="inline-block mt-4 bg-ink text-accent font-display text-[14px] tracking-[2px] px-6 py-2"
          >
            VIEW ALL MATCHES
          </Link>
        </div>
      ) : (
        <AllGroupsGrid sortedGroups={sortedGroups} />
      )}
    </div>
  )
}
