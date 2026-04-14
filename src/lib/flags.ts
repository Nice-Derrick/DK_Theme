import flagDe from '@/assets/flags/4x3/de.svg'
import flagGb from '@/assets/flags/4x3/gb.svg'
import flagHk from '@/assets/flags/4x3/hk.svg'
import flagJp from '@/assets/flags/4x3/jp.svg'
import flagKr from '@/assets/flags/4x3/kr.svg'
import flagSg from '@/assets/flags/4x3/sg.svg'
import flagTw from '@/assets/flags/4x3/tw.svg'
import flagUs from '@/assets/flags/4x3/us.svg'

export const FLAG_ASSETS = {
  de: flagDe,
  gb: flagGb,
  hk: flagHk,
  jp: flagJp,
  kr: flagKr,
  sg: flagSg,
  tw: flagTw,
  us: flagUs,
} as const

export type FlagCode = keyof typeof FLAG_ASSETS

export type RegionBadge = {
  code: FlagCode
  label: string
}

type RegionMatcher = {
  code: FlagCode
  label: string
  pattern: RegExp
}

const REGION_MATCHERS: RegionMatcher[] = [
  { code: 'hk', label: '中国香港', pattern: /🇭🇰|香港/i },
  { code: 'jp', label: '日本', pattern: /🇯🇵|日本/i },
  { code: 'sg', label: '新加坡', pattern: /🇸🇬|新加坡/i },
  { code: 'us', label: '美国', pattern: /🇺🇸|美国/i },
  { code: 'tw', label: '中国台湾', pattern: /🇹🇼|台湾/i },
  { code: 'kr', label: '韩国', pattern: /🇰🇷|韩国/i },
  { code: 'gb', label: '英国', pattern: /🇬🇧|英国/i },
  { code: 'de', label: '德国', pattern: /🇩🇪|德国/i },
]

export function getRegionBadgeFromText(text: string): RegionBadge | null {
  for (const matcher of REGION_MATCHERS) {
    if (matcher.pattern.test(text)) {
      return { code: matcher.code, label: matcher.label }
    }
  }

  return null
}

export function getFlagAsset(code: FlagCode) {
  return FLAG_ASSETS[code]
}
