import { supabaseServer } from './supabase-server'
import type {
  MatchEvent,
  Team,
  Player,
  Manager,
  MatchDetail,
  MatchSummary,
  Incident,
  GroupTeamStat,
  BsdMatchStats,
  PlayerMatchStat,
} from './types'

const BSD_BASE  = 'https://sports.bzzoiro.com'
const BSD_TOKEN = process.env.BSD_TOKEN ?? ''
const BSD_HDR   = { Authorization: `Token ${BSD_TOKEN}` }

/* ── FK join select string — used by getEvents + getMatchDetail ── */
const MATCH_SELECT = `
  *,
  venue_detail:venues!venue_id(id, name, city, country, capacity),
  home_manager:managers!home_coach_id(id, name, short_name, nationality),
  away_manager:managers!away_coach_id(id, name, short_name, nationality),
  referee_detail:referees!referee_id(id, name, country, career_games, career_yellow_cards, career_red_cards)
`.trim()

/* ── Map flat Supabase matches row → MatchEvent ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvent(r: any): MatchEvent {
  // venue: prefer FK-joined object, fall back to flat columns
  const vd = r.venue_detail
  const venue = vd
    ? { id: vd.id, name: vd.name ?? '', city: vd.city ?? '', country: vd.country ?? '', capacity: vd.capacity ?? undefined }
    : (r.venue_id || r.venue_name)
      ? { id: r.venue_id ?? 0, name: r.venue_name ?? '', city: r.venue_city ?? '', country: '', capacity: undefined }
      : null

  // coaches: prefer FK-joined manager objects, fall back to flat text columns
  const hm = r.home_manager
  const am = r.away_manager
  const home_coach = hm
    ? { id: hm.id, name: hm.name ?? '', short_name: hm.short_name ?? '', country: hm.nationality ?? '' }
    : r.home_coach ? { id: 0, name: r.home_coach, short_name: '', country: '' } : null
  const away_coach = am
    ? { id: am.id, name: am.name ?? '', short_name: am.short_name ?? '', country: am.nationality ?? '' }
    : r.away_coach ? { id: 0, name: r.away_coach, short_name: '', country: '' } : null

  return {
    id:             r.id,
    home_team:      r.home_team_name ?? '',
    away_team:      r.away_team_name ?? '',
    home_team_id:   r.home_team_id,
    away_team_id:   r.away_team_id,
    home_team_obj:  r.home_team_id  ? { id: r.home_team_id,  name: r.home_team_name  ?? '', short_name: '', country: '' } : null,
    away_team_obj:  r.away_team_id  ? { id: r.away_team_id,  name: r.away_team_name  ?? '', short_name: '', country: '' } : null,
    event_date:     r.event_date,
    round_number:   r.round_number,
    round_name:     r.round_name   ?? '',
    group_name:     r.group_name   ?? '',
    status:         r.status,
    home_score:     r.home_score     ?? null,
    away_score:     r.away_score     ?? null,
    home_score_ht:  r.home_score_ht  ?? null,
    away_score_ht:  r.away_score_ht  ?? null,
    period:         null,
    current_minute: null,
    venue,
    referee:        (() => {
      const rd = r.referee_detail
      if (rd) return { id: rd.id, name: rd.name ?? '', country: rd.country ?? '', career_games: rd.career_games ?? 0, career_yellow_cards: rd.career_yellow_cards ?? 0, career_red_cards: rd.career_red_cards ?? 0 }
      if (r.referee_id || r.referee_name) return { id: r.referee_id ?? 0, name: r.referee_name ?? '', country: '', career_games: 0, career_yellow_cards: 0, career_red_cards: 0 }
      return null
    })(),
    home_coach,
    away_coach,
    actual_home_xg: r.home_xg   ?? null,
    actual_away_xg: r.away_xg   ?? null,
    home_xg_live:   null,
    away_xg_live:   null,
    temperature_c:       r.temperature_c       ?? null,
    wind_speed:          r.wind_speed           ?? null,
    attendance:          r.attendance           ?? null,
    odds_home:           null,
    odds_draw:           null,
    odds_away:           null,
    odds_over_25:        null,
    odds_under_25:       null,
    odds_btts_yes:       null,
    odds_btts_no:        null,
    weather_code:        r.weather_code         ?? null,
    weather_description: r.weather_description  ?? null,
    pitch_condition:     r.pitch_condition      ?? null,
    is_local_derby:      r.is_local_derby       ?? null,
    is_neutral_ground:   r.is_neutral_ground    ?? null,
    h2h_data:            r.h2h_data             ?? null,
    highlights:          r.highlights           ?? null,
    jerseys:             null,
    live_stats:          null,
    funfacts:            null,
  }
}

/* ── All events ── */
export async function getEvents(): Promise<MatchEvent[]> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select(MATCH_SELECT)
    .order('event_date', { ascending: true })
  if (!error && data && data.length > 0) return data.map(rowToEvent)
  // FK join may fail if home_coach_id / away_coach_id lack FK constraints — fall back to plain select
  const { data: plain, error: plainErr } = await supabaseServer
    .from('matches')
    .select('*')
    .order('event_date', { ascending: true })
  if (plainErr || !plain) return []
  return plain.map(rowToEvent)
}

/* ── Real teams (48 nations) ── */
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabaseServer
    .from('teams')
    .select('*')
    .order('name', { ascending: true })
  if (error || !data) return []
  return data.map((r) => ({
    id:         r.id,
    name:       r.name,
    short_name: r.short_name ?? '',
    country:    r.country    ?? '',
    image_url:  r.image_url  ?? undefined,
    coach:      null,
    venue:      null,
  }))
}

/* ── Single team by id ── */
export async function getTeam(id: number): Promise<Team | null> {
  const { data, error } = await supabaseServer
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return { id: data.id, name: data.name, short_name: data.short_name ?? '', country: data.country ?? '', image_url: data.image_url ?? undefined, coach: null, venue: null }
}

/* ── Team roster from players table ── */
export async function getRoster(teamId: number): Promise<Player[]> {
  const { data, error } = await supabaseServer
    .from('players')
    .select('*')
    .eq('national_team_id', teamId)
    .order('jersey_number', { ascending: true })
  if (error || !data) return []
  return data.map((r) => ({
    id:                  r.id,
    name:                r.name,
    short_name:          r.short_name,
    position:            r.position,
    specific_position:   r.specific_position,
    date_of_birth:       r.date_of_birth,
    nationality:         r.nationality,
    height:              r.height,
    weight:              r.weight,
    preferred_foot:      r.preferred_foot,
    market_value:        r.market_value,
    jersey_number:       r.jersey_number,
    availability:        r.availability,
    injury_type:         r.injury_type,
    national_team_id:    r.national_team_id,
    national_team_name:  r.national_team_name,
    current_team_id:     r.current_team_id,
    current_team_name:   r.current_team_name,
    image_url:           r.image_url ?? undefined,
  }))
}

/* ── Completed match detail from Supabase matches table ── */
export async function getMatchDetail(eventId: number): Promise<MatchDetail | null> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select(MATCH_SELECT)
    .eq('id', eventId)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let row = data as any
  if (error || !row) {
    // FK join may fail — fall back to plain select
    const { data: plain, error: plainErr } = await supabaseServer
      .from('matches')
      .select('*')
      .eq('id', eventId)
      .single()
    if (plainErr || !plain) return null
    row = plain
  }
  if (row.status !== 'finished') return null
  return rowToEvent(row) as MatchDetail
}

/* ── Match incidents — fetched live from API ── */
export async function getMatchIncidents(eventId: number): Promise<Incident[]> {
  if (!BSD_TOKEN) return []
  try {
    const res = await fetch(`${BSD_BASE}/api/v2/events/${eventId}/incidents/`, {
      headers: BSD_HDR, next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const raw = await res.json()
    const list: Incident[] = Array.isArray(raw) ? raw : (raw.incidents ?? [])
    return list.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.added_time ?? 0) - (b.added_time ?? 0))
  } catch { return [] }
}

/* ── Match summary — derived from Supabase data ── */
export async function getMatchSummary(eventId: number): Promise<MatchSummary | null> {
  const detail = await getMatchDetail(eventId)
  if (!detail) return null
  const stats = await getPlayerStats(eventId)
  const topRated = [...stats]
    .filter(p => p.rating)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 10)
    .map(p => {
      const row = p as unknown as Record<string, unknown>
      return {
        name:   String(row.player_name ?? ''),
        team:   String(row.team_name   ?? ''),
        pos:    String(row.position    ?? '') || null,
        rating: Number(p.rating),
        goals:  Number(p.goals ?? 0),
      }
    })
  return {
    event_id:     eventId,
    extracted_at: new Date().toISOString(),
    match: {
      home_team:  detail.home_team,
      away_team:  detail.away_team,
      score_ht:   `${detail.home_score_ht ?? 0}-${detail.away_score_ht ?? 0}`,
      score_ft:   `${detail.home_score    ?? 0}-${detail.away_score    ?? 0}`,
      status:     detail.status,
      period:     'FT',
      venue:      detail.venue?.name ?? null,
      city:       detail.venue?.city ?? null,
      referee:    detail.referee?.name ?? null,
      home_xg:    detail.actual_home_xg,
      away_xg:    detail.actual_away_xg,
    },
    scorers:          { home: [], away: [] },
    cards:            { home: [], away: [] },
    substitutions:    { home: [], away: [] },
    top_rated_players: topRated,
    formations:       { home: null, away: null },
    timeline:         [],
  }
}

/* ── Player stats for a match from Supabase, joined with players table for names ── */
export async function getPlayerStats(eventId: number): Promise<PlayerMatchStat[]> {
  const { data, error } = await supabaseServer
    .from('player_match_stats')
    .select('*, player:players!player_id(id, name, short_name, position, image_url)')
    .eq('event_id', eventId)
  if (!error && data && data.length > 0) return data as PlayerMatchStat[]
  // Fallback: join may not be cached yet — fetch without join
  const { data: plain } = await supabaseServer
    .from('player_match_stats')
    .select('*')
    .eq('event_id', eventId)
  return (plain ?? []) as PlayerMatchStat[]
}

/* ── Match lineups — fetched live from API ── */
export interface MatchupPlayer {
  id: number
  name: string
  short_name?: string
  position: string
  jersey_number?: number
}

export interface MatchLineups {
  home: { team_id: number; team_name: string; formation: string; players: MatchupPlayer[]; substitutes: MatchupPlayer[] }
  away: { team_id: number; team_name: string; formation: string; players: MatchupPlayer[]; substitutes: MatchupPlayer[] }
}

export async function getMatchLineups(eventId: number): Promise<MatchLineups | null> {
  if (!BSD_TOKEN) return null
  try {
    const res = await fetch(`${BSD_BASE}/api/v2/events/${eventId}/lineups/`, {
      headers: BSD_HDR, next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const raw = await res.json()
    return raw?.lineups ?? raw ?? null
  } catch { return null }
}

/* ── BSD full_extract stats from Supabase match_bsd_stats table ── */
export async function getMatchBsdStats(eventId: number): Promise<BsdMatchStats | null> {
  const { data, error } = await supabaseServer
    .from('match_bsd_stats')
    .select('*')
    .eq('event_id', eventId)
    .single()
  if (error || !data) return null
  return {
    event_id:          eventId,
    stats:             data.stats             as BsdMatchStats['stats'],
    shotmap:           (data.shotmap          ?? []) as BsdMatchStats['shotmap'],
    average_positions: (data.average_positions ?? { home: [], away: [] }) as BsdMatchStats['average_positions'],
    xg_per_minute:     (data.xg_per_minute    ?? []) as BsdMatchStats['xg_per_minute'],
    momentum:          (data.momentum          ?? []) as BsdMatchStats['momentum'],
  }
}

/* ── Completed event IDs from Supabase ── */
export async function getCompletedEventIds(): Promise<number[]> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select('id')
    .eq('status', 'finished')
  if (error || !data) return []
  return data.map((r) => r.id)
}

/* ── Group standings: try tournament_standings table (API), fall back to derived ── */
export async function getGroupStandings(): Promise<Record<string, GroupTeamStat[]>> {
  // Layer 1: read from tournament_standings table (populated by pipeline --fetch-stats)
  try {
    const { data, error } = await supabaseServer
      .from('tournament_standings')
      .select('*')
      .order('position', { ascending: true })
    if (!error && data && data.length > 0) {
      const groups: Record<string, GroupTeamStat[]> = {}
      for (const row of data) {
        if (!row.group_name) continue
        if (!groups[row.group_name]) groups[row.group_name] = []
        groups[row.group_name].push({
          team_id:   row.team_id,
          team_name: row.team_name ?? '',
          played:    row.played ?? 0,
          won:       row.won ?? 0,
          drawn:     row.drawn ?? 0,
          lost:      row.lost ?? 0,
          gf:        row.goals_for ?? 0,
          ga:        row.goals_against ?? 0,
          gd:        row.goal_difference ?? 0,
          pts:       row.points ?? 0,
          form:      row.form
            ? String(row.form).split('').filter((c: string) => ['W','D','L'].includes(c))
            : [],
        })
      }
      if (Object.keys(groups).length > 0) return groups
    }
  } catch { /* fall through */ }

  // Layer 2: derive from match results in Supabase
  const events = await getEvents()
  const groups: Record<string, Record<number, GroupTeamStat>> = {}

  const groupEvents = events
    .filter(e => e.group_name?.startsWith('Group'))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  for (const ev of groupEvents) {
    const g      = ev.group_name
    const homeId = ev.home_team_obj?.id ?? ev.home_team_id
    const awayId = ev.away_team_obj?.id ?? ev.away_team_id
    if (!homeId || !awayId) continue
    if (!groups[g]) groups[g] = {}

    const init = (id: number, name: string): GroupTeamStat =>
      ({ team_id: id, team_name: name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] })
    if (!groups[g][homeId]) groups[g][homeId] = init(homeId, ev.home_team)
    if (!groups[g][awayId]) groups[g][awayId] = init(awayId, ev.away_team)

    if (ev.status === 'finished' && ev.home_score !== null && ev.away_score !== null) {
      const hs = ev.home_score, as_ = ev.away_score
      const home = groups[g][homeId], away = groups[g][awayId]
      home.played++; away.played++
      home.gf += hs; home.ga += as_; home.gd = home.gf - home.ga
      away.gf += as_; away.ga += hs; away.gd = away.gf - away.ga
      if      (hs > as_) { home.won++; home.pts += 3; away.lost++; home.form.unshift('W'); away.form.unshift('L') }
      else if (hs < as_) { away.won++; away.pts += 3; home.lost++; home.form.unshift('L'); away.form.unshift('W') }
      else               { home.drawn++; home.pts++;   away.drawn++; away.pts++;            home.form.unshift('D'); away.form.unshift('D') }
    }
  }

  const sorted: Record<string, GroupTeamStat[]> = {}
  for (const [g, teams] of Object.entries(groups)) {
    sorted[g] = Object.values(teams).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team_name.localeCompare(b.team_name)
    )
  }
  return sorted
}

/* ── Tournament top scorers ── */
export interface TopScorer {
  player_id: number
  player_name: string | null
  short_name: string | null
  team_id: number | null
  team_name: string | null
  image_url: string | null
  goals: number
  assists: number
  penalties: number
  matches_played: number
  rank: number | null
}

export async function getTopScorers(limit = 10): Promise<TopScorer[]> {
  const { data, error } = await supabaseServer
    .from('top_scorers')
    .select('*')
    .order('goals', { ascending: false })
    .order('assists', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data as TopScorer[]
}

/* ── Live matches ── */
export async function getLiveMatches(): Promise<MatchEvent[]> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select('*')
    .eq('status', 'live')
  if (error || !data) return []
  return data.map(rowToEvent)
}

/* ── Recent results (last N completed) ── */
export async function getRecentResults(limit = 2): Promise<MatchEvent[]> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('event_date', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(rowToEvent)
}

/* ── Upcoming matches ── */
export async function getUpcomingMatches(limit = 8): Promise<MatchEvent[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabaseServer
    .from('matches')
    .select('*')
    .in('status', ['notstarted', 'scheduled'])
    .gt('event_date', now)
    .order('event_date', { ascending: true })
    .limit(limit)
  if (error || !data) return []
  return data.map(rowToEvent)
}

/* ── Venue count ── */
export async function getVenueCount(): Promise<number> {
  const { count } = await supabaseServer
    .from('venues')
    .select('*', { count: 'exact', head: true })
  return count ?? 16
}

/* ── Single player by id ── */
export async function getPlayer(id: number): Promise<Player | null> {
  const { data, error } = await supabaseServer
    .from('players')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as unknown as Player
}

/* ── All match stats for one player across all matches ── */
export async function getPlayerAllMatchStats(playerId: number): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabaseServer
    .from('player_match_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('event_id', { ascending: false })
  if (error || !data) return []
  return data as Record<string, unknown>[]
}

/* ── BSD team-side stats for a list of event IDs ── */
export async function getTeamMatchBsdStats(
  eventIds: number[]
): Promise<Record<number, { home: Record<string, unknown>; away: Record<string, unknown> }>> {
  if (eventIds.length === 0) return {}
  const { data, error } = await supabaseServer
    .from('match_bsd_stats')
    .select('event_id, stats')
    .in('event_id', eventIds)
  if (error || !data) return {}
  const result: Record<number, { home: Record<string, unknown>; away: Record<string, unknown> }> = {}
  for (const row of data) {
    const s = row.stats as { home: Record<string, unknown>; away: Record<string, unknown> } | null
    if (s) result[row.event_id] = s
  }
  return result
}

/* ── Venue detail from venues table ── */
export async function getVenueById(venueId: number): Promise<{ name: string; city: string; country: string; capacity: number } | null> {
  const { data, error } = await supabaseServer
    .from('venues')
    .select('name, city, country, capacity')
    .eq('id', venueId)
    .single()
  if (error || !data) return null
  return data as { name: string; city: string; country: string; capacity: number }
}

/* ── Coach detail from coaches table ── */
export async function getTeamCoach(teamId: number): Promise<{ coach_name: string; coach_country: string } | null> {
  const { data, error } = await supabaseServer
    .from('coaches')
    .select('coach_name, coach_country')
    .eq('team_id', teamId)
    .limit(1)
    .single()
  if (error || !data) return null
  return data as { coach_name: string; coach_country: string }
}

/* ── Manager full profile from managers table ── */
export async function getManager(managerId: number): Promise<Manager | null> {
  const { data, error } = await supabaseServer
    .from('managers')
    .select('*')
    .eq('id', managerId)
    .single()
  if (error || !data) return null
  return data as unknown as Manager
}

/* ── Manager for a team (via coaches join) ── */
export async function getTeamManager(teamId: number): Promise<Manager | null> {
  const { data, error } = await supabaseServer
    .from('coaches')
    .select('coach_id')
    .eq('team_id', teamId)
    .limit(1)
    .single()
  if (error || !data?.coach_id) return null
  return getManager(data.coach_id)
}

/* ── Player stats aggregated across a team's matches ── */
export async function getTeamPlayerStats(eventIds: number[]): Promise<Record<string, unknown>[]> {
  if (eventIds.length === 0) return []
  const { data, error } = await supabaseServer
    .from('player_match_stats')
    .select('player_id, player_name, team_name, position, rating, goals, assists, yellow_cards, red_cards')
    .in('event_id', eventIds)
  if (error || !data) return []
  return data as Record<string, unknown>[]
}

/* ── Stats constants ── */
export const TOTAL_NATIONS = 48
export const TOTAL_GROUPS  = 12
export const TOTAL_MATCHES = 104
