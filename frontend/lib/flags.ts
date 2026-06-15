/* ISO 3166-1 alpha-2 codes for flagcdn.com */
const ISO_CODES: Record<string, string> = {
  Algeria: 'dz', Argentina: 'ar', Australia: 'au', Austria: 'at',
  Belgium: 'be', 'Bosnia & Herzegovina': 'ba', Brazil: 'br',
  'Cabo Verde': 'cv', Cameroon: 'cm', Canada: 'ca', Chile: 'cl', Colombia: 'co',
  'Costa Rica': 'cr', Croatia: 'hr', 'Côte d\'Ivoire': 'ci', Czechia: 'cz', Denmark: 'dk',
  'DR Congo': 'cd', Ecuador: 'ec', Egypt: 'eg', England: 'gb-eng', France: 'fr',
  Germany: 'de', Ghana: 'gh', Greece: 'gr', Haiti: 'ht', Hungary: 'hu',
  Iran: 'ir', Iraq: 'iq', Israel: 'il', Italy: 'it', Japan: 'jp',
  Jordan: 'jo', Kenya: 'ke', Mali: 'ml', Mexico: 'mx', Morocco: 'ma',
  Netherlands: 'nl', 'New Zealand': 'nz', Nigeria: 'ng', Norway: 'no',
  Panama: 'pa', Paraguay: 'py', Peru: 'pe', Poland: 'pl',
  Portugal: 'pt', Qatar: 'qa', Romania: 'ro', 'Saudi Arabia': 'sa', Scotland: 'gb-sct',
  Senegal: 'sn', Serbia: 'rs', Slovakia: 'sk', Slovenia: 'si', 'South Africa': 'za',
  'South Korea': 'kr', Spain: 'es', Sweden: 'se', Switzerland: 'ch', Thailand: 'th',
  Tunisia: 'tn', Turkey: 'tr', 'Türkiye': 'tr', Ukraine: 'ua', Uruguay: 'uy',
  USA: 'us', Uzbekistan: 'uz', Venezuela: 've', Wales: 'gb-wls',
  'Curaçao': 'cw', Zambia: 'zm',
}

/* Returns a flagcdn.com image URL for the given country name.
   cdnSize: one of 20, 40, 80, 160 (pixel width). */
export function getFlagUrl(country: string, cdnSize: 20 | 40 | 80 | 160 = 40): string | null {
  const code = ISO_CODES[country]
  if (!code) return null
  return `https://flagcdn.com/w${cdnSize}/${code}.png`
}

const FLAGS: Record<string, string> = {
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  'Bosnia & Herzegovina': '🇧🇦',
  Brazil: '🇧🇷',
  Cameroon: '🇨🇲',
  Canada: '🇨🇦',
  Chile: '🇨🇱',
  Colombia: '🇨🇴',
  'Costa Rica': '🇨🇷',
  Croatia: '🇭🇷',
  Czechia: '🇨🇿',
  Denmark: '🇩🇰',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Greece: '🇬🇷',
  Hungary: '🇭🇺',
  Iran: '🇮🇷',
  Israel: '🇮🇱',
  Italy: '🇮🇹',
  Japan: '🇯🇵',
  Kenya: '🇰🇪',
  Mali: '🇲🇱',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  'New Zealand': '🇳🇿',
  Nigeria: '🇳🇬',
  Norway: '🇳🇴',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Peru: '🇵🇪',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Romania: '🇷🇴',
  'Saudi Arabia': '🇸🇦',
  Senegal: '🇸🇳',
  Serbia: '🇷🇸',
  Slovakia: '🇸🇰',
  Slovenia: '🇸🇮',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  Spain: '🇪🇸',
  Switzerland: '🇨🇭',
  Thailand: '🇹🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  Ukraine: '🇺🇦',
  Uruguay: '🇺🇾',
  USA: '🇺🇸',
  Venezuela: '🇻🇪',
  Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  Zambia: '🇿🇲',
}

export function getFlag(country: string): string {
  return FLAGS[country] ?? '🏳️'
}

const ABBREVS: Record<string, string> = {
  Algeria: 'ALG', Argentina: 'ARG', Australia: 'AUS', Austria: 'AUT',
  Belgium: 'BEL', 'Bosnia & Herzegovina': 'BIH', Brazil: 'BRA',
  Cameroon: 'CMR', Canada: 'CAN', Chile: 'CHI', Colombia: 'COL',
  'Costa Rica': 'CRC', Croatia: 'CRO', Czechia: 'CZE', Denmark: 'DEN',
  Ecuador: 'ECU', Egypt: 'EGY', England: 'ENG', France: 'FRA',
  Germany: 'GER', Ghana: 'GHA', Greece: 'GRE', Hungary: 'HUN',
  Iran: 'IRN', Israel: 'ISR', Italy: 'ITA', Japan: 'JPN',
  Kenya: 'KEN', Mali: 'MLI', Mexico: 'MEX', Morocco: 'MAR',
  Netherlands: 'NED', 'New Zealand': 'NZL', Nigeria: 'NGA', Norway: 'NOR',
  Panama: 'PAN', Paraguay: 'PAR', Peru: 'PER', Poland: 'POL',
  Portugal: 'POR', Romania: 'ROU', 'Saudi Arabia': 'KSA', Senegal: 'SEN',
  Serbia: 'SRB', Slovakia: 'SVK', Slovenia: 'SVN', 'South Africa': 'RSA',
  'South Korea': 'KOR', Spain: 'ESP', Switzerland: 'SUI', Thailand: 'THA',
  Tunisia: 'TUN', Turkey: 'TUR', Ukraine: 'UKR', Uruguay: 'URU',
  USA: 'USA', Venezuela: 'VEN', Wales: 'WAL', Zambia: 'ZMB',
}

export function getAbbrev(country: string): string {
  return ABBREVS[country] ?? country.slice(0, 3).toUpperCase()
}
