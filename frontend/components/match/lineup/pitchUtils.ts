import type { PlayerFlags, MatchupPlayerSlim } from '../types'
import type { Incident } from '@/lib/types'

export function buildPlayerFlags(incidents: Incident[]): PlayerFlags {
  const map: PlayerFlags = new Map()
  const get = (name: string) => {
    if (!map.has(name)) map.set(name, { yellow: false, red: false, goals: 0, penalties: 0 })
    return map.get(name)!
  }
  for (const inc of incidents) {
    if (inc.type === 'card' && inc.player) {
      const f = get(inc.player)
      if (inc.card_type === 'yellow') f.yellow = true
      if (inc.card_type === 'red')    f.red    = true
    }
    if (inc.type === 'goal' && inc.player) {
      const f = get(inc.player)
      f.goals++
      if (inc.goal_type === 'penalty') f.penalties++
    }
    if (inc.type === 'substitution') {
      if (inc.player_in)  get(inc.player_in).subIn   = inc.minute
      if (inc.player_out) get(inc.player_out).subOut = inc.minute
    }
  }
  return map
}

export function pairs<T>(a: T[], b: T[]): [T | null, T | null][] {
  const len = Math.max(a.length, b.length)
  return Array.from({ length: len }, (_, i) => [a[i] ?? null, b[i] ?? null])
}

export const posBg: Record<string, string> = { G: '#cc7a00', D: '#1a6b2e', M: '#1a3f6b', F: '#6b1a1a' }

export function playerFlags(player: MatchupPlayerSlim, flags: PlayerFlags) {
  return flags.get(player.name) ?? flags.get(player.short_name ?? '') ?? { yellow: false, red: false, goals: 0, penalties: 0, subIn: undefined, subOut: undefined }
}

export function parseFormRows(formation: string): number[] {
  const parts = formation.split('-').map(Number).filter(n => !isNaN(n) && n > 0)
  return [1, ...parts]
}

export function layoutOnPitch(
  players: MatchupPlayerSlim[], rows: number[],
  PW: number, PH: number, isHome: boolean
): Array<{ player: MatchupPlayerSlim; cx: number; cy: number }> {
  const numCols = rows.length
  const xGK  = isHome ? 22  : PW - 22
  const xFwd = isHome ? 148 : PW - 148
  const result: Array<{ player: MatchupPlayerSlim; cx: number; cy: number }> = []
  let idx = 0
  for (let col = 0; col < numCols; col++) {
    const count = rows[col]
    const t   = numCols > 1 ? col / (numCols - 1) : 0
    const cx  = xGK + (xFwd - xGK) * t
    const yStep = PH / (count + 1)
    for (let row = 0; row < count; row++) {
      if (idx >= players.length) break
      result.push({ player: players[idx++], cx, cy: yStep * (row + 1) })
    }
  }
  return result
}
