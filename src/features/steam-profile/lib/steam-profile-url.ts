export type SteamProfileReference =
  | { type: 'steamid'; value: string; canonicalUrl: string }
  | { type: 'vanity'; value: string; canonicalUrl: string }

const STEAM_ID_PATTERN = /^7656119\d{10}$/
const VANITY_PATTERN = /^[A-Za-z0-9_-]{2,64}$/

export function normalizeSteamProfileUrl(input: string): SteamProfileReference | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }

  const hostname = url.hostname.toLowerCase()
  if (!['steamcommunity.com', 'www.steamcommunity.com'].includes(hostname)) return null
  if (!['http:', 'https:'].includes(url.protocol)) return null

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length !== 2) return null

  const [kind, rawValue] = segments
  if (!kind || !rawValue) return null

  let value: string
  try {
    value = decodeURIComponent(rawValue)
  } catch {
    return null
  }

  if (kind === 'profiles' && STEAM_ID_PATTERN.test(value)) {
    return {
      type: 'steamid',
      value,
      canonicalUrl: `https://steamcommunity.com/profiles/${value}/`,
    }
  }

  if (kind === 'id' && VANITY_PATTERN.test(value)) {
    return {
      type: 'vanity',
      value,
      canonicalUrl: `https://steamcommunity.com/id/${value}/`,
    }
  }

  return null
}
