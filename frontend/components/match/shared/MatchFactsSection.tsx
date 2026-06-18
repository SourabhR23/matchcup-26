'use client'

export default function MatchFactsSection({ venue, matchDate, roundLabel, referee, temperatureC, windSpeed, weatherDescription }: {
  venue?: { name?: string; city?: string; country?: string; capacity?: number } | null
  matchDate?: string | null
  roundLabel?: string | null
  referee?: string | null
  temperatureC?: number | null
  windSpeed?: number | null
  weatherDescription?: string | null
}) {
  const fmtKickoff = (d: string) => {
    const dt = new Date(d)
    const date = dt.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    const time = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    return `${date} · ${time} UTC`
  }

  const weatherStr = temperatureC != null
    ? [
        weatherDescription ? weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1) : null,
        `${temperatureC}°C`,
        windSpeed != null ? `${windSpeed} km/h wind` : null,
      ].filter(Boolean).join(' · ')
    : null

  const rows: [string, string][] = [
    ...(venue?.name ? [['Stadium', `${venue.name}${venue.city ? ` · ${venue.city}` : ''}`] as [string, string]] : []),
    ...(weatherStr ? [['Weather', weatherStr] as [string, string]] : []),
    ...(venue?.capacity ? [['Capacity', venue.capacity.toLocaleString()] as [string, string]] : []),
    ...(venue?.country ? [['Country', venue.country] as [string, string]] : []),
    ...(matchDate ? [['Kickoff', fmtKickoff(matchDate)] as [string, string]] : []),
    ...(roundLabel ? [['Round', roundLabel] as [string, string]] : []),
    ...(referee ? [['Referee', referee] as [string, string]] : []),
    ['Competition', 'World Cup 2026'],
  ]

  if (rows.length <= 1) return null

  return (
    <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: '#111', borderBottom: '2px solid #111', paddingBottom: 6, marginBottom: 10 }}>
        MATCH FACTS
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '0.5px solid #f0ece4', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{k}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#111', textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}
