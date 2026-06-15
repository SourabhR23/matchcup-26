'use client'

import styles from './LineupPitchView.module.css'
import FormationPitch from './FormationPitch'
import SubBenchRow from './SubBenchRow'
import { LineupBlockC } from './LineupTableView'
import { buildPlayerFlags, playerFlags } from './pitchUtils'
import type { LineupTeam, MatchupPlayerSlim, PlayerFlags } from '../types'
import type { Incident } from '@/lib/types'

export default function LineupPitchView({ lineups, homeTeam, awayTeam, homeAbbr, awayAbbr, flags, homeCoach, awayCoach }: {
  lineups: { home: LineupTeam; away: LineupTeam }
  homeTeam: string; awayTeam: string; homeAbbr: string; awayAbbr: string
  flags: PlayerFlags; homeCoach?: string | null; awayCoach?: string | null
}) {
  const isSubbedIn = (p: MatchupPlayerSlim) => (playerFlags(p, flags) as {subIn?:number}).subIn !== undefined
  const homeSubs  = lineups.home.substitutes.filter(p =>  isSubbedIn(p))
  const awaySubs  = lineups.away.substitutes.filter(p =>  isSubbedIn(p))
  const homeBench = lineups.home.substitutes.filter(p => !isSubbedIn(p))
  const awayBench = lineups.away.substitutes.filter(p => !isSubbedIn(p))

  const SecHead = ({ title }: { title: string }) => (
    <div style={{ fontSize:9, letterSpacing:3, fontWeight:700, color:'#555', textAlign:'center', padding:'12px 0 10px', borderBottom:'1px solid #181818', borderTop:'1px solid #181818' }}>
      {title}
    </div>
  )

  return (
    <div style={{ background:'#111' }}>
      <FormationPitch
        homePlayers={lineups.home.players} awayPlayers={lineups.away.players}
        homeFormation={lineups.home.formation || '4-4-2'}
        awayFormation={lineups.away.formation || '4-4-2'}
        homeTeam={homeTeam} awayTeam={awayTeam} flags={flags}
        homeCoach={homeCoach} awayCoach={awayCoach}
      />
      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <>
          <SecHead title="SUBSTITUTES" />
          <div className={styles.benchGrid}>
            <div style={{ borderRight:'1px solid #181818' }}>
              {homeSubs.map((p, i) => <SubBenchRow key={i} player={p} isHome={true} flags={flags} showMinute={true} />)}
            </div>
            <div>
              {awaySubs.map((p, i) => <SubBenchRow key={i} player={p} isHome={false} flags={flags} showMinute={true} />)}
            </div>
          </div>
        </>
      )}
      {(homeBench.length > 0 || awayBench.length > 0) && (
        <>
          <SecHead title="BENCH" />
          <div className={styles.benchGrid}>
            <div style={{ borderRight:'1px solid #181818' }}>
              {homeBench.map((p, i) => <SubBenchRow key={i} player={p} isHome={true} flags={flags} showMinute={false} />)}
            </div>
            <div>
              {awayBench.map((p, i) => <SubBenchRow key={i} player={p} isHome={false} flags={flags} showMinute={false} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
