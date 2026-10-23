export type SteamProfile = {
  steamId: string
  nickname: string
  avatarUrl: string
  profileUrl: string
}

export function isSteamProfile(value: unknown): value is SteamProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Record<string, unknown>

  return (
    typeof profile.steamId === 'string' &&
    /^7656119\d{10}$/.test(profile.steamId) &&
    typeof profile.nickname === 'string' &&
    profile.nickname.length > 0 &&
    profile.nickname.length <= 64 &&
    typeof profile.avatarUrl === 'string' &&
    profile.avatarUrl.startsWith('https://') &&
    typeof profile.profileUrl === 'string' &&
    profile.profileUrl.startsWith('https://steamcommunity.com/')
  )
}
