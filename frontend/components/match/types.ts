import type { Incident, BsdMatchStats, GroupTeamStat } from '@/lib/types'

export interface ExtStats {
  shots: number; onTarget: number; passes: number; accuratePasses: number
  dribbles: number; dribblesWon: number; tackles: number; tacklesWon: number
  clearances: number; interceptions: number; blocks: number; recoveries: number
  longBalls: number; crosses: number; aerialWon: number; aerialTotal: number
  fouls: number; fouled: number; yellow: number; red: number; xg: number; keyPasses: number
}

export interface MatchupPlayerSlim {
  id: number; name: string; short_name?: string; position: string; jersey_number?: number; image_url?: string
}
export interface LineupTeam {
  formation: string; players: MatchupPlayerSlim[]; substitutes: MatchupPlayerSlim[]
}
export interface TopPlayer { name: string; team: string; pos: string; rating: number; goals: number }

export type PlayerFlags = Map<string, { yellow: boolean; red: boolean; subIn?: number; subOut?: number; goals: number; penalties: number }>

export interface OvProps {
  homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string
  incidents: Incident[]; hStats: ExtStats; aStats: ExtStats; hasStats: boolean
  xgHome: number|null; xgAway: number|null
  homeYellows: number; awayYellows: number; homeReds: number; awayReds: number
  hPassAcc: number; aPassAcc: number
  topPlayers: TopPlayer[]
  playerImageMap?: Map<string, string>
  bsdStats?: BsdMatchStats | null
  prediction: MatchTabsProps['prediction']
  venue?: { name?:string; city?:string; country?:string; capacity?:number } | null
  matchDate?: string|null; roundLabel?: string|null
}

export interface MatchTabsProps {
  homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string
  incidents: Incident[]
  hStats: ExtStats; aStats: ExtStats; hasStats: boolean
  xgHome: number | null; xgAway: number | null
  homeScorers: Record<string, number>; awayScorers: Record<string, number>
  topPlayers: TopPlayer[]
  playerRosterImages?: { name: string; shortName?: string; imageUrl: string }[]
  lineups: { home: LineupTeam; away: LineupTeam } | null
  bsdStats?: BsdMatchStats | null
  prediction: { probHomeWin: number | null; probDraw: number | null; probAwayWin: number | null; mostLikelyScore: string | null } | null
  venue?: { name?: string; city?: string; country?: string; capacity?: number } | null
  matchDate?: string | null
  roundLabel?: string | null
  homeCoach?: string | null
  awayCoach?: string | null
  groupStandings?: GroupTeamStat[] | null
  groupName?: string | null
}
