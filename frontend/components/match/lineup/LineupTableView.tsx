'use client'

import styles from './LineupTableView.module.css'
import type { PlayerFlags, MatchupPlayerSlim } from '../types'
import { playerFlags, posBg, pairs } from './pitchUtils'

export function HomeCellC({ player, flags }: { player: MatchupPlayerSlim; flags: PlayerFlags }) {
  const f = playerFlags(player, flags)
  const sub = (f as { subOut?: number }).subOut
    ? <span style={{ fontSize: 9, color: '#cc0000', flexShrink: 0 }}>{(f as { subOut?: number }).subOut}&apos;</span>
    : (f as { subIn?: number }).subIn
    ? <span style={{ fontSize: 9, color: '#22a060', flexShrink: 0 }}>{(f as { subIn?: number }).subIn}&apos;</span>
    : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      <span style={{ fontSize: 28, fontWeight: 900, color: '#ede8df', lineHeight: 1, width: 38, textAlign: 'right', flexShrink: 0, marginRight: 10, fontVariantNumeric: 'tabular-nums' }}>
        {player.jersey_number}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 8, letterSpacing: 2, color: posBg[player.position] ?? '#999', fontWeight: 700, marginBottom: 1 }}>{player.position}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#111', fontWeight: 700, flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.short_name ?? player.name}
          </span>
          {f.goals > 0 && Array.from({ length: f.goals }).map((_, i) => <span key={i} style={{ fontSize: 10, flexShrink: 0 }}>âš½</span>)}
          {f.yellow && <span style={{ display: 'inline-block', width: 7, height: 10, background: 'var(--color-warning)', borderRadius: 1, flexShrink: 0 }} />}
          {f.red    && <span style={{ display: 'inline-block', width: 7, height: 10, background: '#cc0000', borderRadius: 1, flexShrink: 0 }} />}
          {sub}
        </div>
      </div>
    </div>
  )
}

export function AwayCellC({ player, flags }: { player: MatchupPlayerSlim; flags: PlayerFlags }) {
  const f = playerFlags(player, flags)
  const sub = (f as { subOut?: number }).subOut
    ? <span style={{ fontSize: 9, color: '#cc0000', flexShrink: 0 }}>{(f as { subOut?: number }).subOut}&apos;</span>
    : (f as { subIn?: number }).subIn
    ? <span style={{ fontSize: 9, color: '#22a060', flexShrink: 0 }}>{(f as { subIn?: number }).subIn}&apos;</span>
    : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 8, letterSpacing: 2, color: posBg[player.position] ?? '#999', fontWeight: 700, marginBottom: 1 }}>{player.position}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {sub}
          {f.red    && <span style={{ display: 'inline-block', width: 7, height: 10, background: '#cc0000', borderRadius: 1, flexShrink: 0 }} />}
          {f.yellow && <span style={{ display: 'inline-block', width: 7, height: 10, background: 'var(--color-warning)', borderRadius: 1, flexShrink: 0 }} />}
          {f.goals > 0 && Array.from({ length: f.goals }).map((_, i) => <span key={i} style={{ fontSize: 10, flexShrink: 0 }}>âš½</span>)}
          <span style={{ fontSize: 12, color: '#111', fontWeight: 700, flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.short_name ?? player.name}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 28, fontWeight: 900, color: '#ede8df', lineHeight: 1, width: 38, textAlign: 'left', flexShrink: 0, marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>
        {player.jersey_number}
      </span>
    </div>
  )
}

export function LineupBlockC({ label, homePlayers, awayPlayers, homeTeam, awayTeam, homeFormation, awayFormation, flags, isFirst }: {
  label: string; homePlayers: MatchupPlayerSlim[]; awayPlayers: MatchupPlayerSlim[]
  homeTeam: string; awayTeam: string; homeFormation?: string; awayFormation?: string
  flags: PlayerFlags; isFirst?: boolean
}) {
  return (
    <div>
      {/* Team names only in first block (Starting XI) */}
      {isFirst && (
        <div className={styles.sectionHeader}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', letterSpacing: 1 }}>{homeTeam.toUpperCase()}</div>
            {homeFormation && <div style={{ fontSize: 9, color: '#111', letterSpacing: 2, marginTop: 1 }}>{homeFormation}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', letterSpacing: 1 }}>{awayTeam.toUpperCase()}</div>
            {awayFormation && <div style={{ fontSize: 9, color: '#111', letterSpacing: 2, marginTop: 1 }}>{awayFormation}</div>}
          </div>
        </div>
      )}
      {/* Section label below team names */}
      <div style={{ fontSize: 9, letterSpacing: 4, color: '#bbb', textTransform: 'uppercase', marginBottom: 4, paddingBottom: 6, borderBottom: '1px solid #e8e2d8', textAlign: 'center' }}>
        {label}
      </div>
      {pairs(homePlayers, awayPlayers).map(([hp, ap], i) => (
        <div key={i} className={styles.playerPairRow}>
          <div style={{ padding: '7px 16px 7px 0', display: 'flex', alignItems: 'center' }}>
            {hp && <HomeCellC player={hp} flags={flags} />}
          </div>
          <div style={{ padding: '7px 0 7px 16px', display: 'flex', alignItems: 'center', borderLeft: '1px solid #ede8df' }}>
            {ap && <AwayCellC player={ap} flags={flags} />}
          </div>
        </div>
      ))}
    </div>
  )
}
