import { getFlagUrl, getAbbrev } from '@/lib/flags'

interface FlagImgProps {
  country: string
  /** Rendered pixel width. Height auto-scales at 3:2 ratio. */
  width?: number
  /** flagcdn.com CDN size bucket */
  cdnSize?: 20 | 40 | 80 | 160
  className?: string
  style?: React.CSSProperties
}

export default function FlagImg({ country, width = 28, cdnSize = 40, className, style }: FlagImgProps) {
  const url = getFlagUrl(country, cdnSize)
  if (!url) {
    return (
      <span style={{ fontSize: width * 0.75, lineHeight: 1, ...style }} className={className}>
        🏳️
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={getAbbrev(country)}
      width={width}
      height={Math.round(width * 0.67)}
      style={{ objectFit: 'cover', display: 'inline-block', flexShrink: 0, ...style }}
      className={className}
    />
  )
}
