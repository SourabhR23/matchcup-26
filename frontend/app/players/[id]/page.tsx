import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlayer, getPlayerMatchHistory } from '@/lib/data'
import FlagImg from '@/components/FlagImg'
import PlayerMatchHistory from '@/components/PlayerMatchHistory'
import PlayerCharts from '@/components/PlayerCharts'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

function calcAge(dob?: string): string {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)).toString()
}

function fmtDOB(dob?: string): string {
  if (!dob) return '—'
  return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtContract(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function fmtValue(v?: number): string {
  if (!v) return '—'
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`
  return `€${v}`
}

function sum(arr: (number | null | undefined)[]): number {
  return arr.reduce<number>((s, v) => s + (v ?? 0), 0)
}

function wavg(arr: (number | null)[]): number | null {
  const valid = arr.filter((v): v is number => v != null)
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null
}

const POS_MAP: Record<string, string> = { G: 'GK', D: 'DF', M: 'MF', F: 'FW' }

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-[7px] border-b border-[#f0ece4] last:border-0">
      <span className="text-[12px] text-ink-faint">{label}</span>
      <span className="text-[12px] font-medium text-ink">{value}</span>
    </div>
  )
}

function StatBlock({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[9px] tracking-[2px] font-bold text-[#bbb] uppercase mb-1 pt-1">
        {title}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between py-[7px] border-b border-[#f0ece4] last:border-0">
          <span className="text-[12px] text-ink-faint">{k}</span>
          <span className="text-[12px] font-medium text-ink">{v}</span>
        </div>
      ))}
    </div>
  )
}

export default async function PlayerPage({ params }: Params) {
  const { id } = await params
  const playerId = parseInt(id, 10)
  if (isNaN(playerId)) return notFound()

  const [rawPlayer, history] = await Promise.all([
    getPlayer(playerId),
    getPlayerMatchHistory(playerId),
  ])

  if (!rawPlayer) return notFound()

  const p = rawPlayer as unknown as Record<string, unknown>
  const nTeamId   = (p.national_team_id   as number) ?? 0
  const nTeamName = (p.national_team_name  as string) ?? (p.nationality as string) ?? '—'
  const clubName  = (p.current_team_name   as string) ?? '—'
  const posCode   = ((p.position as string) ?? '').toUpperCase()
  const posLabel  = POS_MAP[posCode] ?? (p.position as string) ?? ''
  const specificPos = (p.specific_position as string) ?? ''

  // ── Aggregate WC stats ──────────────────────────────────
  const apps           = history.length
  const totalMins      = sum(history.map(r => r.minutes_played))
  const totalGoals     = sum(history.map(r => r.goals))
  const totalAssists   = sum(history.map(r => r.goal_assist))
  const avgRating      = wavg(history.map(r => r.rating))
  const totalXG        = sum(history.map(r => r.expected_goals))
  const totalXA        = sum(history.map(r => r.expected_assists))
  const totalShots     = sum(history.map(r => r.total_shots))
  const totalOnTarget  = sum(history.map(r => r.shots_on_target))
  const totalKP        = sum(history.map(r => r.key_pass))
  const totalPass      = sum(history.map(r => r.total_pass))
  const totalAccPass   = sum(history.map(r => r.accurate_pass))
  const passAcc        = totalPass > 0 ? `${Math.round((totalAccPass / totalPass) * 100)}%` : '—'
  const totalTklWon    = sum(history.map(r => r.won_tackle))
  const totalTkl       = sum(history.map(r => r.total_tackle))
  const totalInter     = sum(history.map(r => r.interception))
  const totalDuelsWon  = sum(history.map(r => r.duel_won))
  const totalDuelsLost = sum(history.map(r => r.duel_lost))
  const totalDuels     = totalDuelsWon + totalDuelsLost
  const duelPct        = totalDuels > 0 ? ` (${Math.round((totalDuelsWon / totalDuels) * 100)}%)` : ''
  const totalYellow    = sum(history.map(r => r.yellow_card))
  const totalRed       = sum(history.map(r => r.red_card))
  const shotAcc        = totalShots > 0 ? `${Math.round((totalOnTarget / totalShots) * 100)}%` : '—'

  const showAttacking  = totalShots > 0 || totalXG > 0 || totalKP > 0
  const showDefensive  = totalTklWon > 0 || totalInter > 0
  const showDuels      = totalDuels > 0 || totalYellow > 0 || totalRed > 0

  return (
    <div>
      <Link href={`/teams/${nTeamId}`} className="back-btn mb-4 block">← BACK TO SQUAD</Link>

      {/* ── Hero ── */}
      <div
        className="mb-4 p-5"
        style={{ background: '#111', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'start' }}
      >
        {/* Photo + number */}
        <div className="flex flex-col items-center gap-2">
          {(p.image_url as string) && (
            <img
              src={p.image_url as string}
              alt={p.name as string}
              width={80} height={80}
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid #2a2a2a' }}
            />
          )}
          <div
            className="font-display select-none"
            style={{ fontSize: (p.image_url as string) ? 36 : 88, color: '#333', lineHeight: 1 }}
          >
            {(p.jersey_number as number) ?? '—'}
          </div>
        </div>

        {/* Name + meta */}
        <div>
          <div className="text-[10px] text-[#555] tracking-[2px] mb-1">
            {posLabel}{specificPos ? ` · ${specificPos}` : ''}
          </div>
          <div className="font-display leading-none" style={{ fontSize: 40, color: '#f5f0e8', letterSpacing: 2 }}>
            {(p.name as string).toUpperCase()}
          </div>
          <div className="text-[13px] text-[#666] mt-1">{clubName}</div>
          <div className="flex items-center gap-2 mt-2">
            <FlagImg country={nTeamName} width={20} cdnSize={40} style={{ borderRadius: 1 }} />
            <span className="text-[11px] text-[#777]">{nTeamName}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-px" style={{ background: '#222' }}>
          {[
            { v: apps,                          label: 'APPS'    },
            { v: totalGoals,                    label: 'GOALS'   },
            { v: avgRating?.toFixed(1) ?? '—',  label: 'AVG RTG' },
          ].map(({ v, label }) => (
            <div key={label} className="bg-[#1a1a1a] px-4 py-3 text-center">
              <div className="font-display leading-none" style={{ fontSize: 28, color: 'var(--color-accent)' }}>{v}</div>
              <div className="text-[9px] text-[#555] tracking-[1px] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info + Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Player Info */}
        <div className="bg-surface border border-muted p-4">
          <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 mb-3">PLAYER INFO</div>
          {([
            ['Club',           clubName],
            ['National Team',  nTeamName],
            ['Date of Birth',  fmtDOB(p.date_of_birth as string)],
            ['Age',            calcAge(p.date_of_birth as string) + ' years'],
            ['Nationality',    (p.nationality as string) ?? '—'],
            ['Height',         (p.height as number) ? `${p.height} cm` : '—'],
            ['Weight',         (p.weight as number) ? `${p.weight} kg` : '—'],
            ['Preferred Foot', (p.preferred_foot as string) ?? '—'],
            ['Market Value',   fmtValue(p.market_value as number)],
            ['Contract Until', fmtContract(p.contract_until as string)],
            ['Availability',   (p.availability as string) ?? '—'],
          ] as [string, string][]).map(([k, v]) => (
            <InfoRow key={k} label={k} value={v} />
          ))}
        </div>

        {/* WC 2026 Stats */}
        <div className="bg-surface border border-muted p-4">
          <div className="font-display text-[16px] tracking-[2px] border-b-2 border-ink pb-1 mb-3">WC 2026 STATS</div>

          {apps === 0 ? (
            <p className="text-ink-faint text-[13px] mt-3">No match data available yet.</p>
          ) : (
            <>
              <StatBlock title="Summary" rows={[
                ['Appearances',   apps],
                ['Minutes Played', `${totalMins}'`],
                ['Goals',         totalGoals],
                ['Assists',       totalAssists],
                ['Avg Rating',    avgRating?.toFixed(2) ?? '—'],
              ]} />

              {showAttacking && (
                <StatBlock title="Attacking" rows={[
                  ['xG',           totalXG.toFixed(2)],
                  ['xA',           totalXA.toFixed(2)],
                  ['Shots',        totalShots],
                  ['On Target',    totalOnTarget],
                  ['Shot Accuracy', shotAcc],
                  ['Key Passes',   totalKP],
                  ['Pass Accuracy', passAcc],
                ]} />
              )}

              {showDefensive && (
                <StatBlock title="Defensive" rows={[
                  ['Tackles Won',   `${totalTklWon} / ${totalTkl}`],
                  ['Interceptions', totalInter],
                ]} />
              )}

              {showDuels && (
                <StatBlock title="Duels & Discipline" rows={[
                  ['Duels Won',    totalDuels > 0 ? `${totalDuelsWon} / ${totalDuels}${duelPct}` : '—'],
                  ['Yellow Cards', totalYellow],
                  ['Red Cards',    totalRed],
                ]} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Match History (client, show-more) ── */}
      <PlayerMatchHistory rows={history} />

      {/* ── Charts ── */}
      {history.length > 0 && <PlayerCharts rows={history} />}
    </div>
  )
}
