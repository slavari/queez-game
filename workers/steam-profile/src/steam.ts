export type WorkerSteamProfile = {
  steamId: string
  nickname: string
  avatarUrl: string
  profileUrl: string
}

const STEAM_ID_PATTERN = /^7656119\d{10}$/
const VANITY_PATTERN = /^[A-Za-z0-9_-]{2,64}$/

export type SteamProfileReference =
  | { type: 'steamid'; value: string; profileUrl: string }
  | { type: 'vanity'; value: string; profileUrl: string }

export function createSteamProfileReference(
  type: string | null,
  value: string | null,
): SteamProfileReference | null {
  if (type === 'steamid' && value && STEAM_ID_PATTERN.test(value)) {
    return {
      type,
      value,
      profileUrl: `https://steamcommunity.com/profiles/${value}/`,
    }
  }

  if (type === 'vanity' && value && VANITY_PATTERN.test(value)) {
    return {
      type,
      value,
      profileUrl: `https://steamcommunity.com/id/${value}/`,
    }
  }

  return null
}

function decodeXml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim()
}

function readTag(xml: string, tag: string) {
  const withoutCdata = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  const match = withoutCdata.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))

  return match?.[1] ? decodeXml(match[1]) : null
}

export function parseSteamProfileXml(
  xml: string,
  reference: SteamProfileReference,
): WorkerSteamProfile | null {
  if (readTag(xml, 'error')) return null

  const steamId = readTag(xml, 'steamID64')
  const nickname = readTag(xml, 'steamID')
  const avatarUrl = readTag(xml, 'avatarFull') ?? readTag(xml, 'avatarMedium')

  if (!steamId || !STEAM_ID_PATTERN.test(steamId) || !nickname || !avatarUrl) return null

  let avatar: URL
  try {
    avatar = new URL(avatarUrl)
  } catch {
    return null
  }

  if (avatar.protocol !== 'https:') return null

  return {
    steamId,
    nickname: nickname.slice(0, 64),
    avatarUrl: avatar.toString(),
    profileUrl: reference.profileUrl,
  }
}
