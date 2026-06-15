import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlayer, getPlayerAllMatchStats, getEvents } from '@/lib/data'
import FlagImg from '@/components/FlagImg'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

function calcAge(dob?: string): string {
  if (!dob) return '—'
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)).toString()
}

function fmtValue(v?: number): string {
  if (!v) return '—'
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`
  return `€${v}`
}

function fmtDOB(dob?: string): string {
  if (!dob) return '—'
  return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const POS_MAP: Record<string, string> = {
  G: 'GK', D: 'DF', M: 'MF', F: 'FW',
}

export default async function PlayerPage({ params }: Params) {
  const { id } = await params
  const playerId = parseInt(id, 10)
  if (isNaN(playerId)) return notFound()

  // Fetch player directly from Supabase
  const [rawPlayer, allStats, events] = await Promise.all([
    getPlayer(playerId),
    getPlayerAllMatchStats(playerId),
    getEvents(),
  ])

  if (!rawPlayer) return notFound()

  const player = rawPlayer as unknown as Record<string, unknown>
  const nationalTeam = player.national_team as { id?: number; name?: string } | undefined
  const currentTeam = player.current_team as { id?: number; name?: string; country?: string } | undefined
  const nTeamId = (player.national_team_id as number) ?? nationalTeam?.id ?? 0
  const nTeamName = (player.national_team_name as string) ?? nationalTeam?.name ?? (player.nationality as string) ?? '—'

  // Build match stats by joining player stats with event data
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e]))

  interface PlayerStatEntry {
    eventId: number
    homeTeam: string
    awayTeam: string
    eventDate: string
    rating?: number
    goals?: number
    assists?: number
    minutesPlayed?: number
    totalShots?: number
    totalPass?: number
    accuratePass?: number
  }

  const matchStats: PlayerStatEntry[] = allStats
    .filter((s) => eventMap[s.event_id as number])
    .map((s) => {
      const ev = eventMap[s.event_id as number]
      return {
        eventId: ev.id,
        homeTeam: ev.home_team,
        awayTeam: ev.away_team,
        eventDate: ev.event_date,
        rating: s.rating as number,
        goals: s.goals as number,
        assists: s.goal_assist as number,
        minutesPlayed: s.minutes_played as number,
        totalShots: s.total_shots as number,
        totalPass: s.total_pass as number,
        accuratePass: s.accurate_pass as number,
      }
    })

  const avgRating = matchStats.length > 0
    ? matchStats.reduce((s, m) => s + (m.rating ?? 0), 0) / matchStats.length
    : null

  const totalGoals = matchStats.reduce((s, m) => s + (m.goals ?? 0), 0)
  const totalAssists = matchStats.reduce((s, m) => s + (m.assists ?? 0), 0)
  const totalMins = matchStats.reduce((s, m) => s + (m.minutesPlayed ?? 0), 0)

  const posLabel = POS_MAP[((player.position as string) ?? '').toUpperCase()] ?? player.position as string

  return (
    <div>
      {/* Back */}
      <Link href={`/teams/${nTeamId}`} className="back-btn mb-4 block">
        ← BACK TO SQUAD
      </Link>

      {/* ── Player hero ── */}
      <div
        className="grid gap-5 p-5 mb-4"
        style={{ background: '#111', gridTemplateColumns: 'auto 1fr auto' }}
      >
        {/* Photo or jersey number */}
        <div className="flex flex-col items-center gap-2">
          {(player.image_url as string) ? (
            <img
              src={player.image_url as string}
              alt={player.name as string}
              width={80}
              height={80}
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid #2a2a2a' }}
            />
          ) : null}
          <div
            className="font-display leading-none select-none"
            style={{ fontSize: (player.image_url as string) ? 36 : 90, color: '#333', lineHeight: 1 }}
          >
            {(player.jersey_number as number) ?? '—'}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-[10px] text-[#555] tracking-[2px] mb-1">{posLabel} · {player.specific_position as string ?? ''}</div>
          <div
            className="font-display text-bg leading-none"
            style={{ fontSize: 42, letterSpacing: 2 }}
          >
            {(player.name as string).toUpperCase()}
          </div>
          <div className="text-[13px] text-[#666] mt-1">
            {currentTeam?.name ?? '—'}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <FlagImg country={nTeamName} width={20} cdnSize={40} style={{ borderRadius: 1 }} />
            <span className="text-[11px] text-[#777]">{nTeamName}</span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-px bg-[#222] self-start">
          <div className="bg-[#1a1a1a] px-4 py-3 text-center">
            <div className="font-display leading-none" style={{ fontSize: 28, color: 'var(--color-accent)' }}>
              {matchStats.length}
            </div>
            <div className="text-[9px] text-[#555] tracking-[1px] mt-1">APPS</div>
          </div>
          <div className="bg-[#1a1a1a] px-4 py-3 text-center">
            <div className="font-display leading-none" style={{ fontSize: 28, color: 'var(--color-accent)' }}>
              {totalGoals}
            </div>
            <div className="text-[9px] text-[#555] tracking-[1px] mt-1">GOALS</div>
          </div>
          <div className="bg-[#1a1a1a] px-4 py-3 text-center">
            <div className="font-display leading-none" style={{ fontSize: 28, color: 'var(--color-accent)' }}>
              {avgRating?.toFixed(1) ?? '—'}
            </div>
            <div className="text-[9px] text-[#555] tracking-[1px] mt-1">AVG RTG</div>
          </div>
        </div>
      </div>

      {/* ── Detail grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Personal info */}
        <div className="bg-surface border border-muted p-4">
          <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 mb-3">
            PLAYER INFO
          </div>
          {[
            ['Date of Birth', fmtDOB(player.date_of_birth as string)],
            ['Age', `${calcAge(player.date_of_birth as string)} years`],
            ['Nationality', player.nationality as string ?? '—'],
            ['Height', player.height ? `${player.height} cm` : '—'],
            ['Weight', player.weight ? `${player.weight} kg` : '—'],
            ['Preferred Foot', player.preferred_foot as string ?? '—'],
            ['Market Value', fmtValue(player.market_value as number)],
            ['Contract Until', player.contract_until as string ?? '—'],
            ['Availability', player.availability as string ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-[#f0ece4] last:border-0 text-[12px]">
              <span className="text-ink-faint">{k}</span>
              <span className="font-medium text-ink">{v}</span>
            </div>
          ))}
        </div>

        {/* Tournament stats */}
        <div className="bg-surface border border-muted p-4">
          <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 mb-3">
            WC 2026 STATS
          </div>
          {[
            ['Appearances', matchStats.length],
            ['Goals', totalGoals],
            ['Assists', totalAssists],
            ['Minutes Played', `${totalMins}&apos;`],
            ['Avg Rating', avgRating?.toFixed(2) ?? '—'],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between py-1.5 border-b border-[#f0ece4] last:border-0 text-[12px]">
              <span className="text-ink-faint">{k}</span>
              <span className="font-medium text-ink" dangerouslySetInnerHTML={{ __html: String(v) }} />
            </div>
          ))}

          {matchStats.length === 0 && (
            <p className="text-ink-faint text-sm mt-2">No match data available yet.</p>
          )}
        </div>
      </div>

      {/* ── Match history ── */}
      {matchStats.length > 0 && (
        <div className="mt-3 bg-surface border border-muted p-4">
          <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 mb-3">
            MATCH HISTORY
          </div>
          <div className="flex flex-col">
            {matchStats.map((m, i) => (
              <Link
                key={i}
                href={`/matches/${m.eventId}`}
                className="flex items-center gap-3 py-2 border-b border-[#f0ece4] last:border-0 hover:bg-[#faf8f4] -mx-4 px-4 transition-colors text-[11px]"
              >
                <span className="text-ink-faint min-w-[60px]">
                  {new Date(m.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex-1 text-[#555]">{m.homeTeam} vs {m.awayTeam}</span>
                {m.goals ? <span className="font-medium text-ink">⚽ {m.goals}</span> : null}
                {m.minutesPlayed ? <span className="text-ink-faint">{m.minutesPlayed}&apos;</span> : null}
                <span
                  className="font-display text-[18px] min-w-[30px] text-right"
                  style={{
                    color: (m.rating ?? 0) >= 8 ? 'var(--color-accent)'
                      : (m.rating ?? 0) >= 7 ? '#333'
                      : '#999',
                  }}
                >
                  {m.rating?.toFixed(1) ?? '—'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
