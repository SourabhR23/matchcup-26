'use client'

import BsdDesign1Broadcast from './BsdDesign1'
import type { BsdMatchStats, Incident } from '@/lib/types'
import type { LineupTeam } from '../types'

export default function BsdStatsPanel(props: {
  bsd: BsdMatchStats; homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string
  incidents: Incident[]; xgHome: number | null; xgAway: number | null
  lineups?: { home: LineupTeam; away: LineupTeam } | null
}) {
  if (!props.bsd.stats?.home || !props.bsd.stats?.away) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div className="font-display" style={{ fontSize: 32, letterSpacing: 4, color: '#222', marginBottom: 8 }}>COMING SOON</div>
        <div style={{ fontSize: 11, color: '#777', letterSpacing: 2 }}>DETAILED STATS PROCESSING</div>
      </div>
    )
  }

  return <BsdDesign1Broadcast {...props} />
}
