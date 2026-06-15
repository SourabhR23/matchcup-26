/* ── Core match event from events_all.json ── */
export interface MatchEvent {
  id: number
  home_team: string
  away_team: string
  home_team_id: number
  away_team_id: number
  home_team_obj: { id: number; name: string; short_name: string; country: string; coach?: { name: string } } | null
  away_team_obj: { id: number; name: string; short_name: string; country: string; coach?: { name: string } } | null
  event_date: string
  round_number: number
  round_name: string
  group_name: string
  status: 'scheduled' | 'live' | 'inprogress' | 'finished' | 'postponed' | 'notstarted'
  home_score: number | null
  away_score: number | null
  home_score_ht: number | null
  away_score_ht: number | null
  period: string | null
  current_minute: number | null
  odds_home: number | null
  odds_draw: number | null
  odds_away: number | null
  actual_home_xg: number | null
  actual_away_xg: number | null
  home_xg_live: number | null
  away_xg_live: number | null
  weather_code: number | null
  temperature_c: number | null
  wind_speed: number | null
  venue: { id: number; name: string; city: string; country: string; capacity: number } | null
  referee: {
    id: number
    name: string
    country: string
    career_games: number
    career_yellow_cards: number
    career_red_cards: number
  } | null
  home_coach?: {
    id: number; name: string; short_name: string; country: string
    profile?: string; preferred_formation?: string
    pressing_intensity?: number; defensive_line?: string; top_styles?: string[]
  } | null
  away_coach?: {
    id: number; name: string; short_name: string; country: string
    profile?: string; preferred_formation?: string
    pressing_intensity?: number; defensive_line?: string; top_styles?: string[]
  } | null
  jerseys?: {
    home?: { player?: { base?: string; sleeve?: string; number?: string; type?: string; real?: boolean }; GK?: { base?: string; sleeve?: string } }
    away?: { player?: { base?: string; sleeve?: string; number?: string; type?: string; real?: boolean }; GK?: { base?: string; sleeve?: string } }
  } | null
  live_stats?: {
    home: Record<string, unknown>
    away: Record<string, unknown>
    first_half?: { home: Record<string, unknown>; away: Record<string, unknown> }
    second_half?: { home: Record<string, unknown>; away: Record<string, unknown> }
  } | null
  funfacts?: Array<{ type_id: number; sentence: string }> | null
  attendance?: number | null
  odds_over_25?: number | null
  odds_under_25?: number | null
  odds_btts_yes?: number | null
  odds_btts_no?: number | null
}

/* ── Team from real_teams.json ── */
export interface Team {
  id: number
  name: string
  short_name: string
  country: string
  image_url?: string
  coach: { name: string; shortName: string } | null
  venue: { id: number; name: string; city: string; country: string; capacity: number } | null
}

/* ── Player from roster_*.json ── */
export interface Player {
  id: number
  name: string
  short_name?: string
  position: string
  specific_position?: string
  date_of_birth?: string
  nationality?: string
  height?: number
  weight?: number
  preferred_foot?: string
  market_value?: number
  jersey_number?: number
  availability?: string
  injury_type?: string
  national_team_id?: number
  national_team_name?: string
  current_team_id?: number
  current_team_name?: string
  club?: string
  age?: number
  rating?: number
  image_url?: string
}

/* ── Manager profile from managers table ── */
export interface Manager {
  id: number
  name: string
  short_name?: string
  nationality?: string
  image_url?: string
  date_of_birth?: string
  tactical_profile?: string   // 'attacking' | 'balanced' | 'defensive'
  team_style?: string         // 'possession' | 'counter' | 'pressing' | 'direct' | 'mixed'
  preferred_formation?: string
  pressing_intensity?: number
  defensive_line?: string
  win_rate?: number
  career_matches?: number
  career_wins?: number
  career_draws?: number
  career_losses?: number
  avg_goals_scored?: number
  avg_goals_conceded?: number
  current_team_id?: number
  current_team_name?: string
}

/* ── Incident from incidents.json ── */
export interface Incident {
  type: 'goal' | 'card' | 'substitution' | 'period' | 'injuryTime' | 'varDecision'
  minute: number
  added_time?: number | null
  player?: string
  player_id?: number
  player_in?: string
  player_in_id?: number
  player_out?: string
  player_out_id?: number
  is_home?: boolean
  card_type?: 'yellow' | 'red'
  goal_type?: string
  assist?: string
  body?: string
  home_score?: number | null
  away_score?: number | null
  text?: string
  decision?: string
  confirmed?: boolean
  length?: number
  sequence?: Array<{
    event: string
    player: string
    pid: number
    pos: { x: number; y: number }
    end?: { x: number; y: number }
    body?: string
    assist?: boolean
  }>
}

/* ── Match detail (detail.json) ── */
export interface MatchDetail extends MatchEvent {
  home_coach_id?: number
  away_coach_id?: number
  referee_id?: number
  venue_id?: number
  home_coach?: { id: number; name: string; short_name: string; country: string }
  away_coach?: { id: number; name: string; short_name: string; country: string }
  weather?: { code: number; description: string; wind_speed: number; temperature_c: number }
  head_to_head?: {
    total_matches: number
    home_wins: number
    draws: number
    away_wins: number
    recent_matches?: Array<{ home: string; away: string; score: string; date: string }>
  }
  lineups?: {
    home: {
      formation: string
      players: LineupPlayer[]
      substitutes: LineupPlayer[]
    }
    away: {
      formation: string
      players: LineupPlayer[]
      substitutes: LineupPlayer[]
    }
  }
  highlights?: { kind: string; title: string; url: string; thumbnail: string }[]
  live_websocket?: boolean
}

export interface LineupPlayer {
  id: number
  name: string
  short_name?: string
  position: string
  specific_position?: string
  jersey_number?: number
  rating?: number
  goals?: number
  yellow_card?: boolean
  red_card?: boolean
  sub_out?: number
  sub_in?: number
  replaces_player_id?: number
}

/* ── Match summary (match_summary.json) ── */
export interface MatchSummary {
  event_id: number
  extracted_at: string
  match: {
    home_team: string
    away_team: string
    score_ht: string
    score_ft: string
    status: string
    period: string
    venue: string | null
    city: string | null
    referee: string | null
    home_xg: number | null
    away_xg: number | null
  }
  scorers: { home: ScorerEntry[]; away: ScorerEntry[] }
  cards: {
    home: CardEntry[]
    away: CardEntry[]
  }
  substitutions: {
    home: SubEntry[]
    away: SubEntry[]
  }
  top_rated_players: TopRatedPlayer[]
  formations: { home: string | null; away: string | null }
  timeline: TimelineEntry[]
}

export interface ScorerEntry {
  name: string
  goals: number
  jersey: string
}

export interface CardEntry {
  name: string
  yellow?: boolean
  red?: boolean
  jersey?: string
  sub_out?: number
}

export interface SubEntry {
  off: string
  on: string | null
  minute: number | null
}

export interface TopRatedPlayer {
  name: string
  team: string
  pos: string | null
  rating: number
  goals: number
}

export interface TimelineEntry {
  minute: number | null
  added_time: number | null
  type: string
  team: string | null
  player: string | null
  player_out: string | null
  detail: string | null
  home_score: number | null
  away_score: number | null
}

/* ── Group standings ── */
export interface GroupTeamStat {
  team_id: number
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
  form: string[]
}

/* ── BSD full_extract/stats.json ── */
export interface BsdFractionStat {
  value: number
  total: number
  pct: number
}

export interface BsdTeamSideStats {
  ball_possession: number
  big_chances: number
  big_chances_scored: number
  corner_kicks: number
  blocked_shots: number
  shots_off_target: number
  shots_on_target: number
  shots_inside_box: number
  shots_outside_box: number
  total_shots: number
  hit_woodwork: number
  offsides: number
  passes: number
  accurate_passes: number
  pass_accuracy_pct: number
  long_balls: BsdFractionStat
  crosses: BsdFractionStat
  dribbles: BsdFractionStat
  aerial_duels: BsdFractionStat
  ground_duels: BsdFractionStat
  final_third_phase?: BsdFractionStat
  big_saves: number
  goalkeeper_saves: number
  total_saves: number
  fouls: number
  free_kicks: number
  goal_kicks: number
  throw_ins: number
  clearances: number
  interceptions: number
  recoveries: number
  tackles: number
  tackles_won: number
  total_tackles: number
  dispossessed: number
  yellow_cards: number
  red_cards: number
  errors_lead_to_a_goal: number
  errors_lead_to_a_shot: number
  fouled_in_final_third: number
  touches_in_penalty_area: number
  final_third_entries: number
  goals_prevented: number
  attack: number
  dangerous_attack: number
  ball_safe: number
  duels: number
  expected_goals: number
  xg?: { actual: number }
  punches: number
  high_claims: number
}

export interface ShotmapEntry {
  xg:  number | null
  xgot: number | null
  min: number | null
  added?: number | null
  type: 'goal' | 'miss' | 'save' | 'block' | 'post'
  body: string | null
  sit:  string | null
  home: boolean
  player_id: number | null
  pos: { x: number; y: number; z: number } | null
  gm:  { x: number; y: number; z: number } | null
  gml: string | null
  gtype?: string | null
  block?: { x: number; y: number; z: number } | null
}

export interface XgMinuteEntry {
  m: number
  xg_home: number
  xg_away: number
  cum_home: number
  cum_away: number
}

export interface AvgPosition {
  x: number
  y: number
  n: number
  name: string
  player_id: number
  pos: string
}

export interface BsdMatchStats {
  event_id: number
  stats: {
    home: BsdTeamSideStats
    away: BsdTeamSideStats
    first_half?:  { home: Partial<BsdTeamSideStats>; away: Partial<BsdTeamSideStats> }
    second_half?: { home: Partial<BsdTeamSideStats>; away: Partial<BsdTeamSideStats> }
  }
  shotmap: ShotmapEntry[]
  momentum: unknown[]
  average_positions: { home: AvgPosition[]; away: AvgPosition[] }
  xg_per_minute: XgMinuteEntry[]
}
