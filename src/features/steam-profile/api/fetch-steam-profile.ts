import { isSteamProfile, type SteamProfile } from '@/features/steam-profile/model/types'
import { normalizeSteamProfileUrl } from '@/features/steam-profile/lib/steam-profile-url'

export type SteamProfileErrorCode =
  | 'INVALID_URL'
  | 'CONFIGURATION_MISSING'
  | 'PROFILE_NOT_FOUND'
  | 'STEAM_UNAVAILABLE'
  | 'STEAM_TIMEOUT'
  | 'INVALID_RESPONSE'

export class SteamProfileError extends Error {
  constructor(public readonly code: SteamProfileErrorCode) {
    super(code)
    this.name = 'SteamProfileError'
  }
}

type FetchSteamProfileOptions = {
  apiBaseUrl?: string
  fetcher?: typeof fetch
  signal?: AbortSignal
}

export async function fetchSteamProfile(
  input: string,
  options: FetchSteamProfileOptions = {},
): Promise<SteamProfile> {
  const reference = normalizeSteamProfileUrl(input)
  if (!reference) throw new SteamProfileError('INVALID_URL')

  const apiBaseUrl = options.apiBaseUrl ?? import.meta.env.VITE_STEAM_PROFILE_API_URL
  if (!apiBaseUrl) throw new SteamProfileError('CONFIGURATION_MISSING')

  const endpoint = new URL(`${apiBaseUrl.replace(/\/$/, '')}/profile`)
  endpoint.searchParams.set('type', reference.type)
  endpoint.searchParams.set('value', reference.value)

  let response: Response
  try {
    response = await (options.fetcher ?? fetch)(endpoint, { signal: options.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SteamProfileError('STEAM_TIMEOUT')
    }
    throw new SteamProfileError('STEAM_UNAVAILABLE')
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new SteamProfileError('INVALID_RESPONSE')
  }

  if (!response.ok) {
    const code =
      body && typeof body === 'object' && 'error' in body ? String(body.error) : 'STEAM_UNAVAILABLE'
    if (code === 'PROFILE_NOT_FOUND') throw new SteamProfileError('PROFILE_NOT_FOUND')
    if (code === 'STEAM_TIMEOUT') throw new SteamProfileError('STEAM_TIMEOUT')
    throw new SteamProfileError('STEAM_UNAVAILABLE')
  }

  const profile = body && typeof body === 'object' && 'profile' in body ? body.profile : null
  if (!isSteamProfile(profile)) throw new SteamProfileError('INVALID_RESPONSE')

  return profile
}
