'use client'

import type { PlayerFlags, MatchupPlayerSlim } from '../types'
import { playerFlags, posBg } from './pitchUtils'

export default function SubBenchRow({ player, isHome, flags, showMinute }: {
  player: MatchupPlayerSlim; isHome: boolean; flags: PlayerFlags; showMinute: boolean
}) {
  const f = playerFlags(player, flags)
  const tc = isHome ? 'var(--color-accent)' : '#d4d4d4'
  const posLabel: Record<string, string> = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Attacker' }
  const subIn  = (f as {subIn?:number}).subIn
  const subOut = (f as {subOut?:number}).subOut
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:'1px solid #181818' }}>
      <div style={{ width:38, height:38, borderRadius:'50%', background:'#141f14', border:`1.5px solid ${isHome ? '#2a3a1a' : '#2a2a2a'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
        {player.image_url
          ? <img src={player.image_url} width={38} height={38} alt={player.name} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
          : <span style={{ fontSize:11, fontWeight:800, color: tc }}>{player.jersey_number ?? '?'}</span>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#f0f0f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {player.short_name ?? player.name}
        </div>
        <div style={{ fontSize:9, color:'#444', marginTop:1 }}>{posLabel[player.position] ?? player.position}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        {f.yellow && <span style={{ display:'inline-block', width:7, height:10, background:'#f5c518', borderRadius:1 }} />}
        {f.red    && <span style={{ display:'inline-block', width:7, height:10, background:'#cc2200', borderRadius:1 }} />}
        {f.goals > 0 && <span style={{ fontSize:11 }}>⚽</span>}
        {showMinute && subIn !== undefined && (
          <span style={{ fontSize:10, color:'#22a060', fontWeight:700 }}>{subIn}&apos;↑</span>
        )}
        {showMinute && subIn === undefined && subOut !== undefined && (
          <span style={{ fontSize:10, color:'#ff5555', fontWeight:700 }}>{subOut}&apos;↓</span>
        )}
      </div>
    </div>
  )
}
