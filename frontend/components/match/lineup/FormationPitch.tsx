'use client'

import { PitchDot } from './PitchDot'
import { layoutOnPitch, parseFormRows } from './pitchUtils'
import type { PlayerFlags, MatchupPlayerSlim } from '../types'

export default function FormationPitch({ homePlayers, awayPlayers, homeFormation, awayFormation, homeTeam, awayTeam, flags, homeCoach, awayCoach }: {
  homePlayers: MatchupPlayerSlim[]; awayPlayers: MatchupPlayerSlim[]
  homeFormation: string; awayFormation: string
  homeTeam: string; awayTeam: string; flags: PlayerFlags
  homeCoach?: string | null; awayCoach?: string | null
}) {
  const PW = 320, PH = 190
  const PS = { x: 8, y: 12, w: 304, h: 166 }
  const scX = PS.w / 105, scY = PS.h / 68
  const paW = 16.5 * scX, paH = 40.32 * scY, paY = PS.y + (PS.h - paH) / 2
  const sxW = 5.5 * scX,  sxH = 18.32 * scY, sxY = PS.y + (PS.h - sxH) / 2
  const gH  = 7.32 * scY, gY  = PS.y + (PS.h - gH) / 2, gW = 2.5
  const cr  = 9.15 * scX
  const ST  = '#1e3a1e'
  const CX  = PS.x + PS.w / 2, CY = PS.y + PS.h / 2

  const homeRows   = parseFormRows(homeFormation)
  const awayRows   = parseFormRows(awayFormation)
  const homeLayout = layoutOnPitch(homePlayers, homeRows, PW, PH, true)
  const awayLayout = layoutOnPitch(awayPlayers, awayRows, PW, PH, false)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px 8px', background:'#0c1a0c', gap:8 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:15, fontWeight:800, color:'var(--color-accent)', letterSpacing:0.5 }}>{homeTeam}</span>
            <span style={{ fontSize:11, color:'#6aaa6a', marginLeft:8, letterSpacing:2 }}>{homeFormation}</span>
          </div>
          {homeCoach && (
            <div style={{ fontSize:11, color:'var(--color-accent)', marginTop:3, display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--color-accent)" style={{ opacity:0.85, flexShrink:0 }}>
                <circle cx="5" cy="3" r="2.2"/>
                <path d="M1 9.5 C1 6.5 9 6.5 9 9.5"/>
              </svg>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{homeCoach}</span>
            </div>
          )}
        </div>
        <div style={{ minWidth:0, flex:1, textAlign:'right' }}>
          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:11, color:'#6aaa6a', marginRight:8, letterSpacing:2 }}>{awayFormation}</span>
            <span style={{ fontSize:15, fontWeight:800, color:'#e8e8e8' }}>{awayTeam}</span>
          </div>
          {awayCoach && (
            <div style={{ fontSize:11, color:'#e0e0e0', marginTop:3, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, overflow:'hidden' }}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{awayCoach}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="#e0e0e0" style={{ opacity:0.85, flexShrink:0 }}>
                <circle cx="5" cy="3" r="2.2"/>
                <path d="M1 9.5 C1 6.5 9 6.5 9 9.5"/>
              </svg>
            </div>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width:'100%', display:'block' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={PS.x + i*(PS.w/10)} y={PS.y} width={PS.w/10} height={PS.h}
            fill={i % 2 === 0 ? '#0a1a0a' : '#0c1f0c'} />
        ))}
        <rect x={PS.x} y={PS.y} width={PS.w} height={PS.h} fill="none" stroke={ST} strokeWidth={0.8} />
        <line x1={CX} y1={PS.y} x2={CX} y2={PS.y + PS.h} stroke={ST} strokeWidth={0.7} />
        <circle cx={CX} cy={CY} r={cr} fill="none" stroke={ST} strokeWidth={0.6} />
        <circle cx={CX} cy={CY} r={1} fill={ST} />
        <rect x={PS.x} y={paY} width={paW} height={paH} fill="none" stroke={ST} strokeWidth={0.6} />
        <rect x={PS.x} y={sxY} width={sxW} height={sxH} fill="none" stroke={ST} strokeWidth={0.4} />
        <rect x={PS.x - gW} y={gY} width={gW} height={gH} fill="none" stroke="#2a5a2a" strokeWidth={0.8} />
        <rect x={PS.x + PS.w - paW} y={paY} width={paW} height={paH} fill="none" stroke={ST} strokeWidth={0.6} />
        <rect x={PS.x + PS.w - sxW} y={sxY} width={sxW} height={sxH} fill="none" stroke={ST} strokeWidth={0.4} />
        <rect x={PS.x + PS.w} y={gY} width={gW} height={gH} fill="none" stroke="#2a5a2a" strokeWidth={0.8} />
        {homeLayout.map(({ player, cx, cy }, i) => (
          <PitchDot key={`h${i}`} player={player} cx={cx} cy={cy} isHome={true} flags={flags} />
        ))}
        {awayLayout.map(({ player, cx, cy }, i) => (
          <PitchDot key={`a${i}`} player={player} cx={cx} cy={cy} isHome={false} flags={flags} />
        ))}
      </svg>
    </div>
  )
}
