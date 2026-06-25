import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTeam, getRoster, getEvents, getGroupStandings,
  getTeamPlayerStats, getVenueById, getTeamCoach, getTeamMatchBsdStats,
  getTeamForm,
} from '@/lib/data'
import TeamDesignTabs, {
  type TeamDesignProps, type TeamResult, type RosterPlayer,
  type StatLeader, type MatchStatRow, type UpcomingMatch, type TeamFormRow,
} from '@/components/TeamDesignTabs'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

function calcAge(dob?: string): string {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)).toString()
}

function fmtKickoff(utc: string) {
  const d = new Date(utc)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC',
  }
}

export default async function TeamPage({ params }: Params) {
  const { id } = await params
  const teamId = parseInt(id, 10)
  if (isNaN(teamId)) return notFound()

  const team = await getTeam(teamId)
  if (!team) return notFound()

  const [roster, events, standings, coachDetail, teamFormData] = await Promise.all([
    getRoster(teamId),
    getEvents(),
    getGroupStandings(),
    getTeamCoach(teamId),
    getTeamForm(teamId, 10),
  ])

  /* ── Team's events ── */
  const teamEvents = events.filter(
    (e) => (e.home_team_obj?.id ?? e.home_team_id) === teamId ||
            (e.away_team_obj?.id ?? e.away_team_id) === teamId
  )
  const group = teamEvents[0]?.group_name ?? ''

  /* ── Group standing + rank ── */
  const groupTeams    = group ? (standings[group] ?? []) : []
  const groupStanding = groupTeams.find(s => s.team_id === teamId) ?? null
  const groupRank     = groupTeams.findIndex(s => s.team_id === teamId) + 1

  /* ── Coach name (from event if not in coaches table) ── */
  let coachName    = coachDetail?.coach_name ?? ''
  let coachCountry = coachDetail?.coach_country ?? ''
  if (!coachName) {
    for (const ev of teamEvents) {
      const isHome = (ev.home_team_obj?.id ?? ev.home_team_id) === teamId
      const name   = isHome ? ev.home_coach?.name : ev.away_coach?.name
      if (name) { coachName = name; break }
    }
  }

  /* ── Venue from venues table ── */
  const firstVenueId = teamEvents.find(e => e.venue?.id)?.venue?.id ?? null
  const venueInfo    = firstVenueId ? await getVenueById(firstVenueId) : null

  /* ── Kit colors ── */
  let homeKitColor: string | null = null
  let awayKitColor: string | null = null
  for (const ev of teamEvents) {
    const isHome = (ev.home_team_obj?.id ?? ev.home_team_id) === teamId
    if (!homeKitColor && ev.jerseys?.home?.player?.base) homeKitColor = ev.jerseys.home.player.base
    if (!awayKitColor && ev.jerseys?.away?.player?.base && !isHome) awayKitColor = ev.jerseys.away.player.base
  }

  /* ── Finished + upcoming split ── */
  const finishedEvents  = teamEvents.filter(e => e.status === 'finished')
  const finishedEventIds = finishedEvents.map(e => e.id)
  const upcomingEvents  = teamEvents
    .filter(e => e.status !== 'finished')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  /* ── BSD match stats (parallel with player stats) ── */
  const [rawPlayerStats, bsdStatsByEvent] = await Promise.all([
    getTeamPlayerStats(finishedEventIds),
    getTeamMatchBsdStats(finishedEventIds),
  ])

  /* ── Match stats table rows ── */
  const matchStatRows: MatchStatRow[] = finishedEvents
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .map(ev => {
      const isHome = (ev.home_team_obj?.id ?? ev.home_team_id) === teamId
      const gf     = isHome ? ev.home_score ?? 0 : ev.away_score ?? 0
      const ga     = isHome ? ev.away_score ?? 0 : ev.home_score ?? 0
      const bsd    = bsdStatsByEvent[ev.id]
      const side   = bsd ? (isHome ? bsd.home : bsd.away) : null
      const getStat = (k: string) => side ? Number(side[k] ?? 0) : null

      return {
        id:          ev.id,
        opponent:    isHome ? ev.away_team : ev.home_team,
        isHome,
        gf,
        ga,
        result:      gf > ga ? 'W' : gf < ga ? 'L' : 'D',
        date:        new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        roundName:   ev.round_name ?? '',
        possession:  getStat('ball_possession'),
        shots:       getStat('total_shots'),
        shotsOn:     getStat('shots_on_target'),
        xg:          side ? Number((side.xg as Record<string,unknown>)?.actual ?? side.expected_goals ?? 0) : null,
        corners:     getStat('corner_kicks'),
        yellowCards: getStat('yellow_cards'),
        redCards:    getStat('red_cards'),
        passAccuracy: side ? Number(side.pass_accuracy_pct ?? 0) : null,
        bigChances:  getStat('big_chances'),
      }
    })

  /* ── Upcoming matches ── */
  const upcomingMatches: UpcomingMatch[] = upcomingEvents.map(ev => {
    const isHome  = (ev.home_team_obj?.id ?? ev.home_team_id) === teamId
    const { date, time } = fmtKickoff(ev.event_date)
    return {
      id:         ev.id,
      opponent:   isHome ? ev.away_team : ev.home_team,
      isHome,
      date,
      time,
      roundName:  ev.round_name ?? ev.group_name ?? '',
      venueName:  ev.venue?.name ?? '',
      venueCity:  ev.venue?.city ?? '',
    }
  })

  /* ── Player stats totals ── */
  type RawTotals = { name: string; pos: string; goals: number; assists: number; ratings: number[]; yellow: number; red: number }
  const totalsMap = new Map<string, RawTotals>()
  for (const s of rawPlayerStats) {
    const key      = String(s.player_id ?? s.player_name ?? '')
    const existing = totalsMap.get(key) ?? { name: String(s.player_name ?? ''), pos: String(s.position ?? ''), goals: 0, assists: 0, ratings: [], yellow: 0, red: 0 }
    existing.goals   += Number(s.goals       ?? 0)
    existing.assists += Number(s.assists      ?? 0)
    existing.yellow  += Number(s.yellow_cards ?? 0)
    existing.red     += Number(s.red_cards    ?? 0)
    if (s.rating) existing.ratings.push(Number(s.rating))
    totalsMap.set(key, existing)
  }
  const statLeaders: StatLeader[] = [...totalsMap.values()]
    .filter(p => p.goals > 0 || p.assists > 0 || p.yellow > 0 || p.red > 0 || p.ratings.length > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .map(p => ({
      name:      p.name,
      pos:       p.pos,
      goals:     p.goals,
      assists:   p.assists,
      avgRating: p.ratings.length > 0 ? (p.ratings.reduce((s, r) => s + r, 0) / p.ratings.length).toFixed(1) : '—',
      yellow:    p.yellow,
      red:       p.red,
    }))

  /* ── Roster ── */
  const rosterForClient: RosterPlayer[] = roster.map(p => ({
    id:               p.id,
    name:             p.name,
    position:         p.position ?? '',
    specificPosition: p.specific_position ?? p.position ?? '',
    jerseyNumber:     p.jersey_number ?? null,
    currentTeamName:  p.current_team_name ?? '',
    age:              calcAge(p.date_of_birth),
    imageUrl:         p.image_url ?? undefined,
  }))

  /* ── Results ── */
  const teamResults: TeamResult[] = finishedEvents
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .map(ev => {
      const isHome = (ev.home_team_obj?.id ?? ev.home_team_id) === teamId
      const gf = isHome ? ev.home_score ?? 0 : ev.away_score ?? 0
      const ga = isHome ? ev.away_score ?? 0 : ev.home_score ?? 0
      return {
        id:        ev.id,
        opponent:  isHome ? ev.away_team : ev.home_team,
        isHome,
        gf,
        ga,
        result:    gf > ga ? 'W' : gf < ga ? 'L' : 'D',
        roundName: ev.round_name ?? '',
        date:      new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })

  const teamForm: TeamFormRow[] = teamFormData.map(r => ({
    id:            r.id,
    opponent:      r.opponent,
    opponentId:    r.opponentId,
    competition:   r.competition,
    isHome:        r.isHome,
    eventDate:     r.eventDate,
    result:        r.result,
    teamScore:     r.teamScore,
    opponentScore: r.opponentScore,
    possession:    r.possession,
    shots:         r.shots,
    shotsOn:       r.shotsOn,
    xg:            r.xg,
    corners:       r.corners,
    yellowCards:   r.yellowCards,
    redCards:      r.redCards,
    passAccuracy:  r.passAccuracy,
    bigChances:    r.bigChances,
  }))

  const props: TeamDesignProps = {
    teamId, teamName: team.name, group, groupRank,
    coachName, coachCountry, venueInfo,
    groupStanding: groupStanding
      ? { played: groupStanding.played, won: groupStanding.won, drawn: groupStanding.drawn, lost: groupStanding.lost, gf: groupStanding.gf, ga: groupStanding.ga, gd: groupStanding.gd, pts: groupStanding.pts }
      : null,
    roster: rosterForClient, teamResults, statLeaders,
    homeKitColor, awayKitColor,
    matchStatRows, upcomingMatches, teamForm,
  }

  return (
    <div>
      <Link href="/groups" className="back-btn mb-4 block">← BACK TO GROUPS</Link>
      <TeamDesignTabs {...props} />
    </div>
  )
}
