import {
  getRecentResults,
  getUpcomingMatches,
  getGroupStandings,
  getTopScorers,
  TOTAL_NATIONS,
  TOTAL_GROUPS,
  TOTAL_MATCHES,
  getVenueCount,
} from '@/lib/data'
import LiveMatchCard from '@/components/LiveMatchCard'
import LiveSection from '@/components/LiveSection'
import UpcomingRow from '@/components/UpcomingRow'
import HomeStandingsWidget from '@/components/HomeStandingsWidget'
import TopScorersWidget from '@/components/TopScorersWidget'
import TournamentTimeline from '@/components/TournamentTimeline'
import fadeStyles from '@/components/ScrollFade.module.css'
import type { GroupTeamStat } from '@/lib/types'

export const dynamic = 'force-dynamic'

function SectionHead({ children, noBorder }: { children: React.ReactNode; noBorder?: boolean }) {
  return (
    <h2
      className="font-display mb-4"
      style={{
        fontSize: 28,
        letterSpacing: 2,
        color: '#111',
        borderBottom: noBorder ? 'none' : '3px solid #111',
        paddingBottom: noBorder ? 0 : 6,
      }}
    >
      {children}
    </h2>
  )
}

function BigStatCard({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div
      className="stat-card flex flex-col gap-2 p-5"
      style={{
        border: '0.5px solid #e8e2d8',
        borderLeft: accent ? '4px solid #111' : '4px solid var(--color-accent)',
        background: accent ? 'var(--color-accent)' : '#fff',
        minHeight: 100,
      }}
    >
      <span
        className="font-display leading-none"
        style={{
          fontSize: 52,
          color: accent ? '#111' : 'var(--color-accent)',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        className="text-[11px] tracking-[2px] uppercase font-bold"
        style={{ color: accent ? '#333' : '#555' }}
      >
        {label}
      </span>
    </div>
  )
}

export default async function OverviewPage() {
  const recentResults = await getRecentResults(2)
  const upcomingMatches = await getUpcomingMatches(8)
  const venueCount = await getVenueCount()
  const topScorers = await getTopScorers(10)
  const allStandings = await getGroupStandings()
  const sortedGroups: [string, GroupTeamStat[]][] = Object.entries(allStandings).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div>
      {/* ══ 1. STAT CARDS + TIMELINE ══ */}
      <section className="mb-8">
        <SectionHead noBorder>FIFA WORLD CUP 2026</SectionHead>
        <div className="fade-grid grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
          <BigStatCard value={TOTAL_NATIONS} label="Nations" />
          <BigStatCard value={TOTAL_GROUPS} label="Groups" />
          <BigStatCard value={TOTAL_MATCHES} label="Matches" accent />
          <BigStatCard value={venueCount || 16} label="Stadiums" />
        </div>
        <TournamentTimeline />
      </section>

      {/* ══ 2. LIVE MATCHES (client component — hidden automatically if no live games) ══ */}
      <LiveSection />

      {/* ══ 3. RECENT RESULTS ══ */}
      {recentResults.length > 0 && (
        <section className="mb-8">
          <SectionHead>RECENT RESULTS</SectionHead>
          <div className="fade-grid grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recentResults.map((ev) => (
              <LiveMatchCard key={ev.id} event={ev} showDate />
            ))}
          </div>
        </section>
      )}

      {/* ══ 4. UPCOMING MATCHES ══ */}
      {upcomingMatches.length > 0 && (
        <section className="mb-8">
          <SectionHead>UPCOMING MATCHES</SectionHead>
          <div className={fadeStyles.fadeWrapVertical} style={{ '--fade-bg': '#fff' } as React.CSSProperties}>
            <div className="border border-[#e8e2d8]" style={{ maxHeight: 204, overflowY: 'auto' }}>
              {upcomingMatches.map((ev) => (
                <UpcomingRow key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 5. TOP SCORERS ══ */}
      {topScorers.length > 0 && (
        <section className="mb-8">
          <TopScorersWidget scorers={topScorers} />
        </section>
      )}

      {/* ══ 6. STANDINGS ══ */}
      {sortedGroups.length > 0 && (
        <section className="mb-8">
          <HomeStandingsWidget groups={sortedGroups} />
        </section>
      )}

    </div>
  )
}
